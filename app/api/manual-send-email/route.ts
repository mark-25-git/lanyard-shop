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
import { EmailType } from '@/types/order-email';

export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreflight(request);
  if (preflightResponse) {
    return preflightResponse;
  }

  // Rate limiting
  const rateLimitResponse = rateLimit(request, 'public');
  if (rateLimitResponse) {
    return addCorsHeaders(request, rateLimitResponse);
  }

  try {
    const body = await request.json();
    const { order_id, email_type } = body;

    if (!order_id || typeof order_id !== 'string') {
      return createUserError(
        'Order ID is required.',
        400,
        request
      );
    }

    if (!email_type || typeof email_type !== 'string') {
      return createUserError(
        'Email type is required.',
        400,
        request
      );
    }

    // Validate email type
    const validEmailTypes: EmailType[] = [
      'order_confirmation',
      'payment_confirmed',
      'order_shipped',
      'order_completed',
    ];

    if (!validEmailTypes.includes(email_type as EmailType)) {
      return createUserError(
        'Invalid email type.',
        400,
        request
      );
    }

    // Sanitize inputs
    const sanitizedOrderId = sanitizeText(order_id, 100);
    const sanitizedEmailType = sanitizeText(email_type, 50) as EmailType;

    if (!sanitizedOrderId || !sanitizedEmailType) {
      return createUserError(
        'Invalid input format.',
        400,
        request
      );
    }

    // Get Supabase client
    let supabase;
    try {
      supabase = createServerClient();
    } catch (clientError: any) {
      console.error('Failed to create Supabase client:', clientError.message);
      return createServerError(
        request,
        new Error('Database connection error.')
      );
    }

    // Fetch order from database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', sanitizedOrderId)
      .single();

    if (orderError || !order) {
      return createNotFoundError(
        'Order not found.',
        request
      );
    }

    // Determine which API endpoint to call based on email type
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    let apiEndpoint = '';
    let requestBody: any = { order_id: order.id };

    switch (sanitizedEmailType) {
      case 'order_confirmation':
        apiEndpoint = `${siteUrl}/api/send-order-confirmation`;
        break;
      case 'payment_confirmed':
        apiEndpoint = `${siteUrl}/api/send-payment-confirmed`;
        break;
      case 'order_shipped':
        // For shipped email, we might need courier info
        // Check if there's a recent shipment
        const { data: shipments } = await supabase
          .from('shipments')
          .select('courier')
          .eq('order_number', order.order_number)
          .order('shipped_at', { ascending: false })
          .limit(1)
          .single();
        
        if (shipments) {
          requestBody.courier = shipments.courier;
        }
        apiEndpoint = `${siteUrl}/api/send-order-shipped`;
        break;
      case 'order_completed':
        apiEndpoint = `${siteUrl}/api/send-order-completed`;
        break;
      default:
        return createUserError(
          'Invalid email type.',
          400,
          request
        );
    }

    // Call the appropriate email API
    try {
      const emailResponse = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const emailData = await emailResponse.json();

      if (!emailResponse.ok || !emailData.success) {
        return addCorsHeaders(
          request,
          NextResponse.json({
            success: false,
            error: emailData.error || 'Failed to send email',
            message: emailData.message || 'Email could not be sent.',
          })
        );
      }

      return addCorsHeaders(
        request,
        NextResponse.json({
          success: true,
          message: 'Email sent successfully',
          emailId: emailData.emailId,
        })
      );
    } catch (fetchError: any) {
      console.error('Error calling email API:', fetchError);
      return createServerError(
        request,
        new Error('Failed to send email')
      );
    }
  } catch (error) {
    console.error('Unexpected error in manual-send-email:', error);
    return createServerError(request, error);
  }
}

