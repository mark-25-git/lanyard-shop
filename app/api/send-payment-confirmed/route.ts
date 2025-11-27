import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getResendClient, getFromEmail } from '@/lib/resend';
import { rateLimit } from '@/lib/rate-limit';
import { handleCorsPreflight, addCorsHeaders } from '@/lib/cors';
import {
  createUserError,
  createServerError,
  createNotFoundError,
} from '@/lib/error-handler';
import { sanitizeText } from '@/lib/sanitize';
import { PaymentConfirmedEmail } from '@/components/emails/PaymentConfirmedEmail';
import { trackEmailSent } from '@/lib/email-tracking';
import React from 'react';
import { render } from '@react-email/render';
import { Order } from '@/types/order';

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
    const { order_id } = body;

    if (!order_id || typeof order_id !== 'string') {
      return createUserError(
        'Order ID is required.',
        400,
        request
      );
    }

    // Sanitize order_id
    const sanitizedOrderId = sanitizeText(order_id, 100);
    if (!sanitizedOrderId) {
      return createUserError(
        'Invalid order ID format.',
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
      console.error('Order not found:', orderError);
      return createNotFoundError(
        'Order not found.',
        request
      );
    }

    // Use main domain (teevent.my) for email links
    const emailDomain = 'https://teevent.my';

    // Generate tracking URL
    const trackingUrl = `${emailDomain}/track?order_number=${encodeURIComponent(order.order_number)}`;

    // WhatsApp link for design file submission
    const whatsappMessage = `Hi Teevent! My order number is ${order.order_number}. I have completed payment and would like to send my design file.`;
    const whatsappUrl = `https://wa.me/60137482481?text=${encodeURIComponent(whatsappMessage)}`;

    // Render email template to HTML string
    const emailHtml = await render(
      React.createElement(PaymentConfirmedEmail, {
        order: order as Order,
        trackingUrl,
        whatsappUrl,
      })
    );

    // Send email via Resend
    try {
      const resend = getResendClient();
      const fromEmail = getFromEmail();

      const { data: emailData, error: emailError } = await resend.emails.send({
        from: `Teevent <${fromEmail}>`,
        to: order.customer_email,
        subject: `Your payment has been confirmed`,
        html: emailHtml,
        replyTo: 'team.teevent@gmail.com',
      });

      if (emailError) {
        console.error('Resend API error:', emailError);
        return addCorsHeaders(
          request,
          NextResponse.json({
            success: false,
            error: 'Failed to send email',
            message: 'Payment confirmed, but email could not be sent.',
          })
        );
      }

      // Track email sent in order_emails table
      await trackEmailSent(order.order_number, 'payment_confirmed');

      console.log('Payment confirmed email sent:', {
        orderId: order.id,
        orderNumber: order.order_number,
        recipient: order.customer_email,
        resendId: emailData?.id,
      });

      return addCorsHeaders(
        request,
        NextResponse.json({
          success: true,
          message: 'Email sent successfully',
          emailId: emailData?.id,
        })
      );
    } catch (resendError: any) {
      console.error('Error sending email:', resendError);
      return addCorsHeaders(
        request,
        NextResponse.json({
          success: false,
          error: 'Failed to send email',
          message: 'Payment confirmed, but email could not be sent.',
        })
      );
    }
  } catch (error) {
    console.error('Unexpected error in send-payment-confirmed:', error);
    return createServerError(request, error);
  }
}

