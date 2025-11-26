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
      shipping,
      promo_code, // Optional promo code
      discount_amount // Optional discount amount (will be re-validated)
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

    // For quantities >= 600, contact us for enterprise pricing
    if (quantity >= 600) {
      return createUserError(
        'For quantities of 600+ pieces, please contact us for enterprise pricing.',
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
    const subtotal = priceCalculation.total_price;

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
    // Sanitize design file URL (Canva link)
    let sanitizedDesignFileUrl: string | null = null;
    if (design_file_url) {
      sanitizedDesignFileUrl = sanitizeUrl(design_file_url);
      // Log if URL was rejected for debugging
      if (!sanitizedDesignFileUrl && design_file_url) {
        console.warn('Design file URL was rejected by sanitization:', design_file_url);
      }
    }
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
    
    // Use provided order number or generate a new one
    const order_number = providedOrderNumber || generateOrderNumber();
    
    // Validate and apply promo code if provided (moved before order creation)
    let final_total = subtotal;
    let promoCodeToSave: string | null = null;
    let discountAmountToSave = 0;
    
    if (promo_code) {
      // Re-validate promo code server-side for security
      const sanitizedPromoCode = sanitizeText(promo_code.trim().toUpperCase(), 50);
      if (sanitizedPromoCode) {
        const { data: promoCodeData, error: promoError } = await supabase
          .from('promo_codes')
          .select('code, discount_amount, is_active, allowed_email')
          .eq('code', sanitizedPromoCode)
          .eq('is_active', true)
          .single();
        
        if (!promoError && promoCodeData) {
          // Check email restriction if promo code has one
          if (promoCodeData.allowed_email) {
            // Normalize emails for case-insensitive comparison
            const normalizedAllowedEmail = promoCodeData.allowed_email.trim().toLowerCase();
            const normalizedCustomerEmail = sanitizedCustomerEmail ? sanitizedCustomerEmail.trim().toLowerCase() : null;

            if (!normalizedCustomerEmail || normalizedCustomerEmail !== normalizedAllowedEmail) {
              // Email doesn't match restriction - ignore promo code
              // Continue without discount (don't fail the order)
            } else {
              // Email matches - apply discount
              const promoDiscount = parseFloat(promoCodeData.discount_amount.toString());
              discountAmountToSave = promoDiscount;
              final_total = Math.max(0, subtotal - promoDiscount);
              promoCodeToSave = promoCodeData.code;
            }
          } else {
            // No email restriction - apply discount
            const promoDiscount = parseFloat(promoCodeData.discount_amount.toString());
            discountAmountToSave = promoDiscount;
            final_total = Math.max(0, subtotal - promoDiscount);
            promoCodeToSave = promoCodeData.code;
          }
        }
        // If promo code is invalid, ignore it and continue without discount
      }
    }

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
        total_price: final_total,
        promo_code: promoCodeToSave,
        discount_amount: discountAmountToSave,
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

    // Generate confirmation token using database function
    let confirmationToken: string | null = null;
    try {
      const { data: tokenData, error: tokenError } = await supabase.rpc('generate_confirmation_token');
      
      if (!tokenError && tokenData) {
        confirmationToken = tokenData;
        
        // Update order with confirmation token
        const { error: updateError } = await supabase
          .from('orders')
          .update({ confirmation_token: confirmationToken })
          .eq('id', data.id);
        
        if (updateError) {
          console.error('Error updating order with confirmation token:', updateError);
          // Don't fail the order creation if token generation fails
          // Token can be generated later if needed
        }
      } else {
        console.error('Error generating confirmation token:', tokenError);
      }
    } catch (tokenGenError) {
      console.error('Exception generating confirmation token:', tokenGenError);
      // Continue without token - order creation succeeded
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

    // Send order confirmation email (non-blocking, fire and forget)
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      // Call email API asynchronously - don't await, don't block order creation
      fetch(`${siteUrl}/api/send-order-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: data.id }),
      }).catch((emailError) => {
        // Log error but don't fail order creation
        console.error('Failed to trigger order confirmation email:', emailError);
      });
    } catch (emailError) {
      // Silent fail - email is non-critical
      console.error('Error triggering email:', emailError);
    }

    // Return order data with confirmation token
    const response = NextResponse.json({
      success: true,
      data: {
        ...data,
        confirmation_token: confirmationToken,
      } as Order,
    });

    return addCorsHeaders(request, response);
  } catch (error) {
    return createServerError(request, error);
  }
}

