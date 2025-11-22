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
    const supabase = createServerClient();
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('id');
    const orderNumber = searchParams.get('order_number');

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

    if (!sanitizedOrderId && !sanitizedOrderNumber) {
      return createUserError(
        'Invalid order identifier provided.',
        400,
        request
      );
    }

    let query = supabase.from('orders').select('*');

    if (sanitizedOrderId) {
      query = query.eq('id', sanitizedOrderId);
    } else if (sanitizedOrderNumber) {
      query = query.eq('order_number', sanitizedOrderNumber);
    }

    const { data, error } = await query.single();

    if (error) {
      // Check if it's a "not found" error
      if (isNotFoundError(error)) {
        return createNotFoundError('Order not found.', request);
      }
      return createServerError(request, error);
    }

    if (!data) {
      return createNotFoundError('Order not found.', request);
    }

    const response = NextResponse.json({
      success: true,
      data: data as Order,
    });

    return addCorsHeaders(request, response);
  } catch (error) {
    return createServerError(request, error);
  }
}

