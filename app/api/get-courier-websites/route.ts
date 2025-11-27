import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';
import { handleCorsPreflight, addCorsHeaders } from '@/lib/cors';
import {
  createServerError,
} from '@/lib/error-handler';

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

    // Fetch active courier websites
    const { data: courierWebsites, error } = await supabase
      .from('courier_websites')
      .select('*')
      .eq('is_active', true)
      .order('courier_name', { ascending: true });

    if (error) {
      console.error('Error fetching courier websites:', error);
      return createServerError(
        request,
        new Error('Failed to fetch courier websites.')
      );
    }

    return addCorsHeaders(
      request,
      NextResponse.json({
        success: true,
        data: courierWebsites || [],
      })
    );
  } catch (error) {
    console.error('Unexpected error in get-courier-websites:', error);
    return createServerError(request, error);
  }
}

