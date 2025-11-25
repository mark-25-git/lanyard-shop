/**
 * Example: Get customer by email with order history
 * 
 * This is a NEW endpoint you can add after migration.
 * Useful for:
 * - Customer lookup
 * - Order history per customer
 * - Customer analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { Customer } from '@/types/customer';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Please provide customer email.' },
        { status: 400 }
      );
    }

    // Get customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found.' },
        { status: 404 }
      );
    }

    // Get customer's orders (optional - can be separate endpoint)
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, status, total_price, created_at')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      success: true,
      data: {
        customer: customer as Customer,
        orders: orders || [],
      },
    });
  } catch (error) {
    console.error('Get customer error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer.' },
      { status: 500 }
    );
  }
}




