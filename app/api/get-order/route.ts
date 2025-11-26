import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';
import { handleCorsPreflight, addCorsHeaders } from '@/lib/cors';
import {
  createUserError,
  createServerError,
  createNotFoundError,
  isNotFoundError,
} from '@/lib/error-handler';
import { sanitizeText } from '@/lib/sanitize';
import { Order } from '@/types/order';

export async function GET(request: NextRequest) {
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
    
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('id');
    const orderNumber = searchParams.get('order_number');
    const sessionToken = searchParams.get('session_token') || request.cookies.get('tracking_session')?.value;

    if (!orderId && !orderNumber) {
      return createUserError(
        'Please provide either order ID or order number.',
        400,
        request
      );
    }

    // Sanitize inputs
    const sanitizedOrderId = orderId ? sanitizeText(orderId, 100) : null;
    const sanitizedOrderNumber = orderNumber ? sanitizeText(orderNumber, 50) : null;
    const sanitizedSessionToken = sessionToken ? sanitizeText(sessionToken, 100) : null;

    if (!sanitizedOrderId && !sanitizedOrderNumber) {
      return createUserError(
        'Invalid order identifier provided.',
        400,
        request
      );
    }

    // If order_number is provided, require session token validation (for tracking page)
    // If order_id is provided, allow direct access (for admin/internal use)
    if (sanitizedOrderNumber && !sanitizedSessionToken) {
      return createUserError(
        'Session token required for order tracking. Please verify your identity first.',
        401,
        request
      );
    }

    let orderData: Order | null = null;

    // If session token is provided, validate it using database function
    if (sanitizedSessionToken && sanitizedOrderNumber) {
      const { data: sessionData, error: sessionError } = await supabase.rpc('validate_tracking_session', {
        p_session_token: sanitizedSessionToken,
        p_order_number: sanitizedOrderNumber
      });

      if (sessionError || !sessionData || sessionData.length === 0 || !sessionData[0] || !sessionData[0].order_data) {
        return createUserError(
          'Invalid or expired session. Please verify your identity again.',
          401,
          request
        );
      }

      orderData = sessionData[0].order_data as Order;
    } else {
      // Direct query (for admin/internal use with order ID, or if no session required)
      let query = supabase.from('orders').select('*');

      if (sanitizedOrderId) {
        query = query.eq('id', sanitizedOrderId);
      } else if (sanitizedOrderNumber) {
        query = query.eq('order_number', sanitizedOrderNumber);
      }

      const { data, error } = await query.single();

      if (error) {
        console.error('Supabase query error:', {
          code: (error as any).code,
          message: error.message,
          details: (error as any).details,
          hint: (error as any).hint
        });
        
        // Check if it's a "not found" error
        if (isNotFoundError(error)) {
          return createNotFoundError('Order not found.', request);
        }
        return createServerError(request, error);
      }

      if (!data) {
        return createNotFoundError('Order not found.', request);
      }

      orderData = data as Order;
    }

    if (!orderData) {
      return createNotFoundError('Order not found.', request);
    }

    const response = NextResponse.json({
      success: true,
      data: orderData,
    });

    return addCorsHeaders(request, response);
  } catch (error) {
    console.error('Unexpected error in get-order:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return createServerError(request, error);
  }
}

