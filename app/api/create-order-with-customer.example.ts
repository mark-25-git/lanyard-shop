/**
 * Example: Updated create-order API with customer table support
 * 
 * This is an OPTIONAL update - the current API will continue to work
 * even after the customer table migration.
 * 
 * To use this:
 * 1. Run the migration SQL first
 * 2. Replace the current create-order route with this version
 * 3. Or create a new endpoint and gradually migrate
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { generateOrderNumber } from '@/lib/pricing';
import { Order } from '@/types/order';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      quantity, 
      unit_price, 
      total_price, 
      design_file_url, 
      order_number: providedOrderNumber,
      customer_name, 
      customer_email, 
      customer_phone,
      billing,
      shipping
    } = body;

    // Validation (same as before)
    if (!quantity || !unit_price || !total_price) {
      return NextResponse.json(
        { error: 'Missing required pricing information.' },
        { status: 400 }
      );
    }

    if (!customer_name || !customer_email || !customer_phone) {
      return NextResponse.json(
        { error: 'Missing required customer information.' },
        { status: 400 }
      );
    }

    if (!billing || !shipping) {
      return NextResponse.json(
        { error: 'Billing and shipping addresses are required.' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const order_number = providedOrderNumber || generateOrderNumber();

    // OPTIONAL: Get or create customer
    // This uses the database function created in migration
    let customerId: string | null = null;
    
    try {
      const { data: customerData, error: customerError } = await supabase.rpc('get_or_create_customer', {
        p_email: customer_email,
        p_phone: customer_phone,
        p_name: customer_name
      });

      if (!customerError && customerData) {
        customerId = customerData;
      }
      // If customer creation fails, continue without customer_id (backward compatible)
    } catch (err) {
      console.warn('Customer lookup failed, continuing without customer_id:', err);
      // Continue - customer_id will be NULL (backward compatible)
    }

    // Create order (same as before, but now includes customer_id)
    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_number,
        customer_id: customerId, // Will be NULL if customer lookup failed
        customer_name,
        customer_email,
        customer_phone,
        quantity,
        unit_price,
        total_price,
        design_file_url: design_file_url || null,
        status: 'payment_pending_verification',
        payment_method: 'bank_transfer',
        // Billing address
        billing_name: billing.name,
        billing_email: billing.email,
        billing_phone: billing.phone,
        billing_address_line1: billing.address_line1,
        billing_address_line2: billing.address_line2 || null,
        billing_city: billing.city,
        billing_state: billing.state,
        billing_postal_code: billing.postal_code,
        billing_country: billing.country || 'Malaysia',
        // Shipping address
        shipping_name: shipping.name,
        shipping_phone: shipping.phone,
        shipping_address_line1: shipping.address_line1,
        shipping_address_line2: shipping.address_line2 || null,
        shipping_city: shipping.city,
        shipping_state: shipping.state,
        shipping_postal_code: shipping.postal_code,
        shipping_country: shipping.country || 'Malaysia',
      })
      .select()
      .single();

    if (error) {
      console.error('Order creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create order. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data as Order,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Failed to create order. Please try again.' },
      { status: 500 }
    );
  }
}




