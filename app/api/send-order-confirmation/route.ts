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
import { OrderConfirmationEmail } from '@/components/emails/OrderConfirmationEmail';
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

  // Rate limiting - public API (this endpoint can be called from order creation)
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

    // Check if email was already sent (optional - prevent duplicates)
    // We'll allow resending for now, but you can add this check later

    // Use main domain (teevent.my) for email links to match Resend sending domain
    // This improves deliverability - email links point directly to teevent.my
    const emailDomain = 'https://teevent.my';

    // Generate URLs using main domain
    // Query parameters will be preserved in the redirect
    const confirmationUrl = order.confirmation_token
      ? `${emailDomain}/confirmation?token=${encodeURIComponent(order.confirmation_token)}`
      : `${emailDomain}/confirmation?order_number=${encodeURIComponent(order.order_number)}`;

    const trackingUrl = `${emailDomain}/track?order_number=${encodeURIComponent(order.order_number)}`;

    // WhatsApp link for design file submission
    const whatsappMessage = `Hi Teevent! My order number is ${order.order_number}. I have completed payment and would like to send my design file.`;
    const whatsappUrl = `https://wa.me/60137482481?text=${encodeURIComponent(whatsappMessage)}`;

    // Render email template to HTML string
    const emailHtml = await render(
      React.createElement(OrderConfirmationEmail, {
        order: order as Order,
        confirmationUrl,
        trackingUrl,
        whatsappUrl,
      })
    );

    // Send email via Resend
    try {
      const resend = getResendClient();
      const fromEmail = getFromEmail();

      // Admin email addresses to notify
      const adminEmails = ['team.teevent@gmail.com', 'tanjj80@gmail.com'];

      // Send email to customer
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: `Teevent <${fromEmail}>`,
        to: order.customer_email,
        subject: `Your order has been confirmed`,
        html: emailHtml,
        // Optional: Add reply-to address
        replyTo: 'team.teevent@gmail.com',
      });

      if (emailError) {
        console.error('Resend API error:', emailError);
        // Don't fail the request - email is non-critical
        // Log error but return success
        return addCorsHeaders(
          request,
          NextResponse.json({
            success: false,
            error: 'Failed to send email',
            message: 'Order was created successfully, but email could not be sent.',
          })
        );
      }

      // Send notification email to admin addresses (same body as customer email)
      // Send each email separately to ensure both are sent
      for (const adminEmail of adminEmails) {
        try {
          const { data: adminEmailData, error: adminEmailError } = await resend.emails.send({
            from: `Teevent <${fromEmail}>`,
            to: adminEmail,
            subject: `New Order Received: ${order.order_number}`,
            html: emailHtml,
            replyTo: 'team.teevent@gmail.com',
          });

          if (adminEmailError) {
            console.error(`Failed to send admin notification to ${adminEmail}:`, adminEmailError);
          } else {
            console.log(`Admin notification email sent successfully to ${adminEmail}:`, adminEmailData?.id);
          }
        } catch (adminEmailException) {
          // Log error but don't fail - admin notification is non-critical
          console.error(`Exception sending admin notification to ${adminEmail}:`, adminEmailException);
        }
      }

      // Track email sent in order_emails table
      await trackEmailSent(order.id, order.order_number, 'order_confirmation');

      console.log('Order confirmation email sent:', {
        orderId: order.id,
        orderNumber: order.order_number,
        recipient: order.customer_email,
        resendId: emailData?.id,
        adminNotificationsSent: adminEmails,
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
      // Don't fail the request - email is non-critical
      return addCorsHeaders(
        request,
        NextResponse.json({
          success: false,
          error: 'Failed to send email',
          message: 'Order was created successfully, but email could not be sent.',
        })
      );
    }
  } catch (error) {
    console.error('Unexpected error in send-order-confirmation:', error);
    return createServerError(request, error);
  }
}

