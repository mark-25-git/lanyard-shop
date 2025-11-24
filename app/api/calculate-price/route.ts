import { NextRequest, NextResponse } from 'next/server';
import { calculatePrice } from '@/lib/pricing';
import { rateLimit, getRateLimitInfo } from '@/lib/rate-limit';
import { handleCorsPreflight, addCorsHeaders } from '@/lib/cors';
import {
  createUserError,
  createServerError,
  createNotFoundError,
} from '@/lib/error-handler';
import { checkBodySize, BODY_SIZE_LIMITS } from '@/lib/body-size-limit';

export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreflight(request);
  if (preflightResponse) {
    return preflightResponse;
  }

  // Check body size limit before parsing
  const sizeCheck = checkBodySize(request, BODY_SIZE_LIMITS.CALCULATE_PRICE);
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
    const { quantity } = body;

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

    let priceCalculation;
    try {
      priceCalculation = await calculatePrice(quantity);
    } catch (error: any) {
      // If it's a database connection error, return 500
      if (error.message?.includes('Database connection') || error.message?.includes('server configuration')) {
        console.error('Database connection error in calculate-price:', error);
        return createServerError(
          request,
          new Error('Database connection error. Please try again later.')
        );
      }
      // Otherwise, treat as no pricing tier found
      return createUserError(
        'No pricing tier found for this quantity. Please contact us for custom pricing.',
        400,
        request
      );
    }

    if (!priceCalculation) {
      return createUserError(
        'No pricing tier found for this quantity. Please contact us for custom pricing.',
        400,
        request
      );
    }

    const response = NextResponse.json({
      success: true,
      data: priceCalculation,
    });

    // Add rate limit headers
    const rateLimitInfo = getRateLimitInfo();
    if (rateLimitInfo) {
      response.headers.set('X-RateLimit-Limit', rateLimitInfo.limit.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimitInfo.remaining.toString());
      response.headers.set('X-RateLimit-Reset', rateLimitInfo.reset);
    }

    return addCorsHeaders(request, response);
  } catch (error) {
    return createServerError(request, error);
  }
}

