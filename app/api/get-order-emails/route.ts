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

export async function GET(request: NextRequest) {
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
    const searchParams = request.nextUrl.searchParams;
    const orderNumber = searchParams.get('order_number');

    if (!orderNumber) {
      return createUserError(
        'Order number is required.',
        400,
        request
      );
    }

    // Sanitize input
    const sanitizedOrderNumber = sanitizeText(orderNumber, 50);

    if (!sanitizedOrderNumber) {
      return createUserError(
        'Invalid order number format.',
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

    // Build query
    const query = supabase
      .from('order_emails')
      .select('*')
      .eq('order_number', sanitizedOrderNumber)
      .order('created_at', { ascending: true });

    const { data: orderEmails, error } = await query;

    if (error) {
      console.error('Error fetching order emails:', error);
      return createServerError(
        request,
        new Error('Failed to fetch order emails.')
      );
    }

    return addCorsHeaders(
      request,
      NextResponse.json({
        success: true,
        data: orderEmails || [],
      })
    );
  } catch (error) {
    console.error('Unexpected error in get-order-emails:', error);
    return createServerError(request, error);
  }
}

