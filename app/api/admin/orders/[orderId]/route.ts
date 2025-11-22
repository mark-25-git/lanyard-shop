import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { handleCorsPreflight, addCorsHeaders } from '@/lib/cors';
import {
  createServerError,
  createNotFoundError,
  isNotFoundError,
} from '@/lib/error-handler';
import { checkBodySize, BODY_SIZE_LIMITS } from '@/lib/body-size-limit';
import { sanitizePaymentReference } from '@/lib/sanitize';
import { Order, OrderStatus } from '@/types/order';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreflight(request);
  if (preflightResponse) {
    return preflightResponse;
  }

  // Rate limiting - strict for admin routes
  const rateLimitResponse = rateLimit(request, 'admin');
  if (rateLimitResponse) {
    return addCorsHeaders(request, rateLimitResponse);
  }

  try {
    // Verify admin authentication
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }
    
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', params.orderId)
      .single();

    if (error) {
      if (isNotFoundError(error)) {
        return createNotFoundError('Order not found', request);
      }
      return createServerError(request, error);
    }

    if (!data) {
      return createNotFoundError('Order not found', request);
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreflight(request);
  if (preflightResponse) {
    return preflightResponse;
  }

  // Check body size limit before parsing
  const sizeCheck = checkBodySize(request, BODY_SIZE_LIMITS.ADMIN_ORDER_UPDATE);
  if (sizeCheck) {
    return addCorsHeaders(request, sizeCheck);
  }

  // Rate limiting - strict for admin routes
  const rateLimitResponse = rateLimit(request, 'admin');
  if (rateLimitResponse) {
    return addCorsHeaders(request, rateLimitResponse);
  }

  try {
    // Verify admin authentication
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }
    
    const body = await request.json();
    const { status, payment_reference } = body;

    const supabase = createServerClient();

    const updateData: any = {};
    
    if (status) {
      const validStatuses: OrderStatus[] = [
        'pending',
        'payment_pending',
        'payment_pending_verification',
        'paid',
        'design_file_pending',
        'design_file_received',
        'in_production',
        'order_shipped',
        'completed',
        'cancelled',
      ];
      if (validStatuses.includes(status)) {
        updateData.status = status;
        
        // If marking as paid, set payment_confirmed_at
        if (status === 'paid' && !updateData.payment_confirmed_at) {
          updateData.payment_confirmed_at = new Date().toISOString();
        }
      }
    }

    if (payment_reference !== undefined) {
      // Sanitize payment reference
      updateData.payment_reference = sanitizePaymentReference(payment_reference);
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', params.orderId)
      .select()
      .single();

    if (error) {
      return createServerError(request, error);
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




