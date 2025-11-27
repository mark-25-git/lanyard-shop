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
import { generateTrackingUrl } from '@/lib/tracking-url';

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
    const { order_id, courier, courier_tracking_number, courier_tracking_url } = body;

    if (!order_id || typeof order_id !== 'string') {
      return createUserError(
        'Order ID is required.',
        400,
        request
      );
    }

    if (!courier || typeof courier !== 'string') {
      return createUserError(
        'Courier is required.',
        400,
        request
      );
    }

    if (!courier_tracking_number || typeof courier_tracking_number !== 'string') {
      return createUserError(
        'Tracking number is required.',
        400,
        request
      );
    }

    // Sanitize inputs
    const sanitizedOrderId = sanitizeText(order_id, 100);
    const sanitizedCourier = sanitizeText(courier, 100);
    const sanitizedTrackingNumber = sanitizeText(courier_tracking_number, 200);

    if (!sanitizedOrderId || !sanitizedCourier || !sanitizedTrackingNumber) {
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

    // Determine tracking URL
    let finalTrackingUrl = courier_tracking_url;

    // If URL not provided, try to get from courier_websites table
    if (!finalTrackingUrl || typeof finalTrackingUrl !== 'string') {
      const { data: courierWebsite } = await supabase
        .from('courier_websites')
        .select('tracking_url_template')
        .eq('courier_name', sanitizedCourier)
        .eq('is_active', true)
        .single();

      if (courierWebsite && courierWebsite.tracking_url_template) {
        // Generate URL from template
        finalTrackingUrl = generateTrackingUrl(
          courierWebsite.tracking_url_template,
          sanitizedTrackingNumber
        );
      } else {
        // If courier not found, create a default URL or require admin to provide one
        // For now, we'll create a basic URL structure
        // Admin should have provided the URL if courier doesn't exist
        return createUserError(
          `Courier "${sanitizedCourier}" not found. Please provide a tracking URL.`,
          400,
          request
        );
      }
    }

    // Sanitize tracking URL
    const sanitizedTrackingUrl = sanitizeText(finalTrackingUrl, 500);
    if (!sanitizedTrackingUrl) {
      return createUserError(
        'Invalid tracking URL format.',
        400,
        request
      );
    }

    // Check if courier exists in courier_websites, if not, auto-save it
    const { data: existingCourier } = await supabase
      .from('courier_websites')
      .select('id')
      .eq('courier_name', sanitizedCourier)
      .single();

    if (!existingCourier) {
      // Extract template from URL (replace tracking number with placeholder)
      // This is a simple approach - assumes tracking number appears once in URL
      const template = sanitizedTrackingUrl.replace(
        encodeURIComponent(sanitizedTrackingNumber),
        '{tracking_number}'
      );

      // Auto-save to courier_websites
      await supabase
        .from('courier_websites')
        .upsert({
          courier_name: sanitizedCourier,
          tracking_url_template: template,
          is_active: true,
        }, {
          onConflict: 'courier_name'
        });
    }

    // Create shipment record
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .insert({
        order_number: order.order_number,
        courier: sanitizedCourier,
        courier_tracking_number: sanitizedTrackingNumber,
        courier_tracking_url: sanitizedTrackingUrl,
        shipped_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (shipmentError || !shipment) {
      console.error('Error creating shipment:', shipmentError);
      return createServerError(
        request,
        new Error('Failed to create shipment record.')
      );
    }

    return addCorsHeaders(
      request,
      NextResponse.json({
        success: true,
        message: 'Shipment created successfully',
        data: shipment,
      })
    );
  } catch (error) {
    console.error('Unexpected error in create-shipment:', error);
    return createServerError(request, error);
  }
}

