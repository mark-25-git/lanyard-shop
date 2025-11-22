import { NextRequest, NextResponse } from 'next/server';
import { createUserError } from './error-handler';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// In production with multiple instances, consider using Redis
const requestStore = new Map<string, RequestRecord>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestStore.entries()) {
    if (now > record.resetTime) {
      requestStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

/**
 * Get client identifier (IP address)
 */
function getClientId(request: NextRequest): string {
  // Try to get real IP from headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || request.ip || 'unknown';
  return ip;
}

/**
 * Rate limit configuration for different endpoint types
 */
const rateLimitConfigs: Record<string, RateLimitConfig> = {
  // Admin routes - strict
  admin: {
    maxRequests: 30, // 30 requests
    windowMs: 60000, // per minute
  },
  // Login routes - very strict (prevent brute force)
  login: {
    maxRequests: 5, // 5 requests
    windowMs: 60000, // per minute
  },
  // File upload - moderate (large files)
  upload: {
    maxRequests: 10, // 10 requests
    windowMs: 3600000, // per hour
  },
  // Public API routes - more lenient
  public: {
    maxRequests: 60, // 60 requests
    windowMs: 60000, // per minute
  },
};

/**
 * Rate limit info for adding headers to responses
 */
let currentRateLimitInfo: {
  limit: number;
  remaining: number;
  reset: string;
} | null = null;

/**
 * Get current rate limit info (for adding headers to responses)
 */
export function getRateLimitInfo() {
  return currentRateLimitInfo;
}

/**
 * Check if request should be rate limited
 * Returns null if allowed, or error response if rate limited
 */
export function rateLimit(
  request: NextRequest,
  endpointType: 'admin' | 'login' | 'upload' | 'public' = 'public'
): NextResponse | null {
  const config = rateLimitConfigs[endpointType];
  const clientId = getClientId(request);
  const key = `${clientId}:${endpointType}`;
  const now = Date.now();

  // Get or create record
  let record = requestStore.get(key);

  // Reset if window expired
  if (!record || now > record.resetTime) {
    record = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }

  // Increment count
  record.count++;
  requestStore.set(key, record);

  // Store info for headers
  const remaining = Math.max(0, config.maxRequests - record.count);
  currentRateLimitInfo = {
    limit: config.maxRequests,
    remaining,
    reset: new Date(record.resetTime).toISOString(),
  };

  // Check if limit exceeded
  if (record.count > config.maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    const response = createUserError(
      'Too many requests. Please try again later.',
      429
    );
    // Add rate limit headers
    response.headers.set('Retry-After', retryAfter.toString());
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', '0');
    response.headers.set('X-RateLimit-Reset', new Date(record.resetTime).toISOString());
    return response;
  }

  // Request allowed
  return null;
}

/**
 * Rate limit middleware wrapper
 * Use this in API routes
 */
export function withRateLimit(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  endpointType: 'admin' | 'login' | 'upload' | 'public' = 'public'
) {
  return async (request: NextRequest, ...args: any[]) => {
    const rateLimitResponse = rateLimit(request, endpointType);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Add rate limit headers to response
    const response = await handler(request, ...args);
    
    // Get current rate limit info for headers
    const clientId = getClientId(request);
    const key = `${clientId}:${endpointType}`;
    const record = requestStore.get(key);
    const config = rateLimitConfigs[endpointType];
    
    if (record) {
      const remaining = Math.max(0, config.maxRequests - record.count);
      response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      response.headers.set('X-RateLimit-Reset', new Date(record.resetTime).toISOString());
    }

    return response;
  };
}

