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
import { Order } from '@/types/order';

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
    const { order_number, last_four_digits } = body;

    // Validate inputs
    if (!order_number || typeof order_number !== 'string') {
      return createUserError(
        'Order number is required.',
        400,
        request
      );
    }

    if (!last_four_digits || typeof last_four_digits !== 'string') {
      return createUserError(
        'Last 4 digits of phone number is required.',
        400,
        request
      );
    }

    // Sanitize inputs
    const sanitizedOrderNumber = sanitizeText(order_number.trim().toUpperCase(), 50);
    const sanitizedLastFour = sanitizeText(last_four_digits.trim().replace(/\D/g, ''), 4);

    if (!sanitizedOrderNumber) {
      return createUserError(
        'Invalid order number format.',
        400,
        request
      );
    }

    if (!sanitizedLastFour || sanitizedLastFour.length !== 4) {
      return createUserError(
        'Please provide exactly 4 digits of your phone number.',
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

    // Call database function to verify tracking access
    const { data, error } = await supabase.rpc('verify_tracking_access', {
      p_order_number: sanitizedOrderNumber,
      p_last_four_digits: sanitizedLastFour
    });

    if (error) {
      console.error('Error verifying tracking access:', error);
      // Don't reveal if order exists - return generic error
      return createUserError(
        'The order number and phone do not match.',
        401,
        request
      );
    }

    // Check if verification was successful
    // Note: Return column is named 'token' (not 'session_token') to avoid SQL ambiguity
    if (!data || data.length === 0 || !data[0] || !data[0].order_data || !data[0].token) {
      // Verification failed - provide clearer message without revealing if order exists
      return createUserError(
        'The order number and phone do not match.',
        401,
        request
      );
    }

    const orderData = data[0].order_data as Order;
    const sessionToken = data[0].token as string;

    // Create response with order data and session token
    const response = NextResponse.json({
      success: true,
      data: orderData,
      session_token: sessionToken,
    });

    // Set HTTP-only cookie for session management
    response.cookies.set('tracking_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1800, // 30 minutes
      path: '/',
    });

    return addCorsHeaders(request, response);
  } catch (error) {
    console.error('Unexpected error in verify-tracking:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return createServerError(request, error);
  }
}

