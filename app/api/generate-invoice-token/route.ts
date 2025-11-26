import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';
import { handleCorsPreflight, addCorsHeaders } from '@/lib/cors';
import {
  createUserError,
  createServerError,
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
  const sizeCheck = checkBodySize(request, BODY_SIZE_LIMITS.CREATE_ORDER);
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
    const { order_number } = body;

    // Validate inputs
    if (!order_number || typeof order_number !== 'string') {
      return createUserError(
        'Order number is required.',
        400,
        request
      );
    }

    // Sanitize order number
    const sanitizedOrderNumber = sanitizeText(order_number.trim().toUpperCase(), 50);
    if (!sanitizedOrderNumber) {
      return createUserError(
        'Invalid order number format.',
        400,
        request
      );
    }

    // Check for valid session token (user must be verified on tracking page)
    const sessionToken = request.cookies.get('tracking_session')?.value;
    if (!sessionToken) {
      return createUserError(
        'Session required. Please verify your identity on the tracking page first.',
        401,
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

    // Validate session token matches the order number
    const { data: sessionData, error: sessionError } = await supabase.rpc('validate_tracking_session', {
      p_session_token: sanitizeText(sessionToken, 100),
      p_order_number: sanitizedOrderNumber
    });

    if (sessionError || !sessionData || sessionData.length === 0) {
      return createUserError(
        'Invalid or expired session. Please verify your identity again.',
        401,
        request
      );
    }

    // Generate invoice download token
    const { data: tokenData, error: tokenError } = await supabase.rpc('generate_invoice_token', {
      p_order_number: sanitizedOrderNumber
    });

    if (tokenError || !tokenData || tokenData.length === 0 || !tokenData[0] || !tokenData[0].token) {
      console.error('Error generating invoice token:', tokenError);
      return createServerError(
        request,
        new Error('Failed to generate download token. Please try again.')
      );
    }

    const downloadToken = tokenData[0].token as string;

    const response = NextResponse.json({
      success: true,
      token: downloadToken,
    });

    return addCorsHeaders(request, response);
  } catch (error) {
    console.error('Unexpected error in generate-invoice-token:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return createServerError(request, error);
  }
}

