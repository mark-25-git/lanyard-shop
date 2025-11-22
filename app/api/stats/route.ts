import { NextRequest, NextResponse } from 'next/server';
import { getStats } from '@/lib/stats';
import { rateLimit } from '@/lib/rate-limit';
import { handleCorsPreflight, addCorsHeaders } from '@/lib/cors';
import { createServerError } from '@/lib/error-handler';

export async function GET(request: NextRequest) {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreflight(request);
  if (preflightResponse) {
    return preflightResponse;
  }

  // Rate limiting - public API
  const rateLimitResponse = rateLimit(request, 'public');
  if (rateLimitResponse) {
    return addCorsHeaders(request, rateLimitResponse);
  }

  try {
    const stats = await getStats();

    if (!stats) {
      return createServerError(
        request,
        new Error('Failed to fetch stats')
      );
    }

    // Format numbers with commas
    const formatNumber = (num: number): string => {
      return num.toLocaleString('en-US');
    };

    const response = NextResponse.json({
      success: true,
      data: {
        unique_events: stats.unique_events,
        lanyards_delivered: stats.lanyards_delivered,
        complaints: stats.complaints,
        // Formatted versions for display
        formatted: {
          unique_events: formatNumber(stats.unique_events),
          lanyards_delivered: formatNumber(stats.lanyards_delivered),
          complaints: formatNumber(stats.complaints),
        },
      },
    });

    return addCorsHeaders(request, response);
  } catch (error) {
    return createServerError(request, error);
  }
}


