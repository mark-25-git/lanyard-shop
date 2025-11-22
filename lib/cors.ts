import { NextRequest, NextResponse } from 'next/server';

/**
 * Allowed origins for CORS
 */
const getAllowedOrigins = (): string[] => {
  const origins: string[] = [];

  // Production domain
  const productionDomain = process.env.NEXT_PUBLIC_SITE_URL || 'https://teevent.my';
  if (productionDomain) {
    origins.push(productionDomain);
  }

  // Development
  origins.push('http://localhost:3000');
  origins.push('http://127.0.0.1:3000');

  // Vercel preview deployments
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`);
  }

  return origins;
};

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) {
    return false;
  }

  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.some(allowed => {
    // Exact match
    if (origin === allowed) {
      return true;
    }
    // Wildcard subdomain match (e.g., *.vercel.app)
    if (allowed.includes('*')) {
      const pattern = allowed.replace('*', '.*');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(origin);
    }
    return false;
  });
}

/**
 * Get CORS headers for a request
 */
export function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin');
  const isAllowed = isOriginAllowed(origin);

  const headers: Record<string, string> = {};

  if (isAllowed && origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  headers['Access-Control-Allow-Methods'] = 'GET, POST, PATCH, OPTIONS';
  headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
  headers['Access-Control-Max-Age'] = '86400'; // 24 hours

  return headers;
}

/**
 * Handle CORS preflight request (OPTIONS)
 */
export function handleCorsPreflight(request: NextRequest): NextResponse | null {
  if (request.method === 'OPTIONS') {
    const headers = getCorsHeaders(request);
    return new NextResponse(null, {
      status: 204, // No Content
      headers,
    });
  }
  return null;
}

/**
 * Add CORS headers to response
 */
export function addCorsHeaders(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  const headers = getCorsHeaders(request);
  
  // Add CORS headers to response
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}




