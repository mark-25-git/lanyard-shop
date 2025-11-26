import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';
import { handleCorsPreflight, addCorsHeaders } from '@/lib/cors';
import {
  createUserError,
  createServerError,
  createNotFoundError,
} from '@/lib/error-handler';
import { sanitizeText } from '@/lib/sanitize';
import { Order } from '@/types/order';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreflight(request);
  if (preflightResponse) {
    return preflightResponse;
  }

  // Rate limiting - public API
  const rateLimitResponse = rateLimit(request, 'public');
  if (rateLimitResponse) {
    return addCorsHeaders(request, rateLimitResponse);
  }

  try {
    const { token } = params;

    if (!token || typeof token !== 'string') {
      return createUserError(
        'Confirmation token is required.',
        400,
        request
      );
    }

    // Sanitize token
    const sanitizedToken = sanitizeText(token, 100);
    if (!sanitizedToken) {
      return createUserError(
        'Invalid confirmation token format.',
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

    // Call database function to use confirmation token (one-time access)
    const { data, error } = await supabase.rpc('use_confirmation_token', {
      token: sanitizedToken
    });

    if (error) {
      console.error('Error using confirmation token:', error);
      return createNotFoundError(
        'This confirmation link has expired or is invalid.',
        request
      );
    }

    // Check if token was valid and unused
    if (!data || data.length === 0 || !data[0] || !data[0].order_data) {
      return createNotFoundError(
        'This confirmation link has expired or is invalid. This page can only be viewed once for security reasons.',
        request
      );
    }

    // Extract order data from JSONB
    const orderData = data[0].order_data as Order;

    const response = NextResponse.json({
      success: true,
      data: orderData,
    });

    return addCorsHeaders(request, response);
  } catch (error) {
    console.error('Unexpected error in confirmation:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return createServerError(request, error);
  }
}

