import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { rateLimit, getRateLimitInfo } from '@/lib/rate-limit';
import { handleCorsPreflight, addCorsHeaders } from '@/lib/cors';
import {
  createUserError,
  createServerError,
  createNotFoundError,
} from '@/lib/error-handler';
import { checkBodySize, BODY_SIZE_LIMITS } from '@/lib/body-size-limit';
import { sanitizeText } from '@/lib/sanitize';

export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreflight(request);
  if (preflightResponse) {
    return preflightResponse;
  }

  // Check body size limit before parsing
  const sizeCheck = checkBodySize(request, BODY_SIZE_LIMITS.CALCULATE_PRICE);
  if (sizeCheck) {
    return addCorsHeaders(request, sizeCheck);
  }

  // Rate limiting - public API
  const rateLimitResponse = rateLimit(request, 'public');
  if (rateLimitResponse) {
    return addCorsHeaders(request, rateLimitResponse);
  }

  try {
    const body = await request.json();
    const { code, total_price, customer_email } = body;

    // Validate inputs
    if (!code || typeof code !== 'string') {
      return createUserError(
        'Promo code is required.',
        400,
        request
      );
    }

    if (!total_price || typeof total_price !== 'number' || total_price < 0) {
      return createUserError(
        'Valid total price is required.',
        400,
        request
      );
    }

    // Sanitize promo code
    const sanitizedCode = sanitizeText(code.trim().toUpperCase(), 50);
    if (!sanitizedCode) {
      return createUserError(
        'Invalid promo code format.',
        400,
        request
      );
    }

    let supabase;
    try {
      supabase = createServerClient();
    } catch (clientError: any) {
      console.error('Failed to create Supabase client:', clientError.message);
      return createServerError(
        request,
        new Error('Database connection error. Please check server configuration.')
      );
    }

    // Look up promo code
    const { data: promoCode, error } = await supabase
      .from('promo_codes')
      .select('code, discount_amount, is_active, allowed_email')
      .eq('code', sanitizedCode)
      .eq('is_active', true)
      .single();

    if (error || !promoCode) {
      return createNotFoundError(
        'Invalid or inactive promo code.',
        request
      );
    }

    // Check email restriction if promo code has one
    if (promoCode.allowed_email) {
      // Normalize emails for case-insensitive comparison
      const normalizedAllowedEmail = promoCode.allowed_email.trim().toLowerCase();
      const normalizedCustomerEmail = customer_email ? customer_email.trim().toLowerCase() : null;

      if (!normalizedCustomerEmail || normalizedCustomerEmail !== normalizedAllowedEmail) {
        return createNotFoundError(
          'This promo code is not available for your account.',
          request
        );
      }
    }

    // Calculate discount
    const discountAmount = parseFloat(promoCode.discount_amount.toString());
    const finalTotal = Math.max(0, total_price - discountAmount);

    const response = NextResponse.json({
      success: true,
      data: {
        valid: true,
        code: promoCode.code,
        discount_amount: discountAmount,
        final_total: finalTotal,
      },
    });

    // Add rate limit headers
    const rateLimitInfo = getRateLimitInfo();
    if (rateLimitInfo) {
      response.headers.set('X-RateLimit-Limit', rateLimitInfo.limit.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimitInfo.remaining.toString());
      response.headers.set('X-RateLimit-Reset', rateLimitInfo.reset);
    }

    return addCorsHeaders(request, response);
  } catch (error) {
    return createServerError(request, error);
  }
}

