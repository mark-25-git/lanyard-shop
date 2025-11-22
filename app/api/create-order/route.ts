import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { generateOrderNumber, calculatePrice } from '@/lib/pricing';
import { rateLimit } from '@/lib/rate-limit';
import { handleCorsPreflight, addCorsHeaders } from '@/lib/cors';
import {
  createUserError,
  createServerError,
  createNotFoundError,
} from '@/lib/error-handler';
import { checkBodySize, BODY_SIZE_LIMITS } from '@/lib/body-size-limit';
import {
  sanitizeText,
  sanitizeEmail,
  sanitizePhone,
  sanitizeUrl,
  sanitizeAddress,
} from '@/lib/sanitize';
import { Order } from '@/types/order';
import { incrementStat } from '@/lib/stats';

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
    const { 
      quantity, 
      // SECURITY: Do not accept unit_price or total_price from client
      // These will be recalculated server-side
      design_file_url, 
      event_or_organization_name,
      order_number: providedOrderNumber, // Optional: use pre-generated order number
      customer_name, 
      customer_email, 
      customer_phone,
      billing,
      shipping
    } = body;

    // Validate quantity
    if (!quantity || typeof quantity !== 'number' || quantity < 1) {
      return createUserError(
        'Invalid quantity. Please provide a number greater than 0.',
        400,
        request
      );
    }

    // MOQ is 50
    if (quantity < 50) {
      return createUserError(
        'Minimum order quantity is 50 pieces.',
        400,
        request
      );
    }

    // For quantities > 599, contact us
    if (quantity > 599) {
      return createUserError(
        'For quantities above 599 pieces, please contact us for custom pricing.',
        400,
        request
      );
    }

    // SECURITY: Recalculate price server-side - never trust client-provided prices
    const priceCalculation = await calculatePrice(quantity);
    if (!priceCalculation) {
      return createNotFoundError(
        'No pricing tier found for this quantity. Please contact us for custom pricing.',
        request
      );
    }

    // Use server-calculated prices
    const unit_price = priceCalculation.unit_price;
    const total_price = priceCalculation.total_price;

    if (!customer_name || !customer_email || !customer_phone) {
      return createUserError(
        'Missing required customer information.',
        400,
        request
      );
    }

    // design_file_url is optional - files will be sent via WhatsApp after payment

    if (!billing || !shipping) {
      return createUserError(
        'Billing and shipping addresses are required.',
        400,
        request
      );
    }

    // Sanitize all user inputs
    const sanitizedCustomerName = sanitizeText(customer_name, 200);
    const sanitizedCustomerEmail = sanitizeEmail(customer_email);
    const sanitizedCustomerPhone = sanitizePhone(customer_phone);
    const sanitizedBilling = sanitizeAddress(billing);
    const sanitizedShipping = sanitizeAddress(shipping);
    const sanitizedDesignFileUrl = design_file_url ? sanitizeUrl(design_file_url) : null;
    const sanitizedEventOrOrgName = event_or_organization_name ? sanitizeText(event_or_organization_name, 200) : null;

    // Validate sanitized inputs
    if (!sanitizedCustomerName || !sanitizedCustomerEmail || !sanitizedCustomerPhone) {
      return createUserError(
        'Invalid customer information provided.',
        400,
        request
      );
    }

    if (!sanitizedBilling || !sanitizedShipping) {
      return createUserError(
        'Invalid address information provided.',
        400,
        request
      );
    }

    const supabase = createServerClient();
    // Use provided order number or generate a new one
    const order_number = providedOrderNumber || generateOrderNumber();

    // Create order with sanitized billing and shipping addresses
    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_number,
        customer_name: sanitizedCustomerName,
        customer_email: sanitizedCustomerEmail,
        customer_phone: sanitizedCustomerPhone,
        quantity,
        unit_price,
        total_price,
        design_file_url: sanitizedDesignFileUrl,
        event_or_organization_name: sanitizedEventOrOrgName,
        status: 'payment_pending_verification',
        payment_method: 'bank_transfer',
        // Billing address (sanitized)
        billing_name: sanitizedBilling.name,
        billing_email: sanitizedBilling.email,
        billing_phone: sanitizedBilling.phone,
        billing_address_line1: sanitizedBilling.address_line1,
        billing_address_line2: sanitizedBilling.address_line2,
        billing_city: sanitizedBilling.city,
        billing_state: sanitizedBilling.state,
        billing_postal_code: sanitizedBilling.postal_code,
        billing_country: sanitizedBilling.country,
        // Shipping address (sanitized)
        shipping_name: sanitizedShipping.name,
        shipping_phone: sanitizedShipping.phone,
        shipping_address_line1: sanitizedShipping.address_line1,
        shipping_address_line2: sanitizedShipping.address_line2,
        shipping_city: sanitizedShipping.city,
        shipping_state: sanitizedShipping.state,
        shipping_postal_code: sanitizedShipping.postal_code,
        shipping_country: sanitizedShipping.country,
      })
      .select()
      .single();

    if (error) {
      return createServerError(request, error);
    }

    // Increment stats for new order
    // Every new order = new event (+1) and adds to lanyards delivered (+quantity)
    try {
      await incrementStat('unique_events', 1);
      await incrementStat('lanyards_delivered', quantity);
    } catch (statsError) {
      // Log error but don't fail the order creation
      console.error('Error incrementing stats:', statsError);
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

