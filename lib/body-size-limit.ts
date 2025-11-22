import { NextRequest, NextResponse } from 'next/server';
import { createUserError } from './error-handler';

/**
 * Body size limits for different API routes (in bytes)
 */
export const BODY_SIZE_LIMITS = {
  // Order creation - customer info, addresses, billing, shipping
  CREATE_ORDER: 50 * 1024, // 50KB (generous for addresses and optional fields)
  
  // Price calculation - just quantity number
  CALCULATE_PRICE: 1 * 1024, // 1KB
  
  // Admin login - email and password
  ADMIN_LOGIN: 2 * 1024, // 2KB
  
  // Admin order update - status and optional payment reference
  ADMIN_ORDER_UPDATE: 5 * 1024, // 5KB
  
  // File upload - FormData with file (file itself is validated separately)
  UPLOAD_DESIGN: 100 * 1024 * 1024, // 100MB (for FormData metadata + file)
  
  // Default limit for unknown routes
  DEFAULT: 10 * 1024, // 10KB
} as const;

/**
 * Check if request body size exceeds the limit
 * Returns error response if limit exceeded, null if OK
 */
export function checkBodySize(
  request: NextRequest,
  maxSize: number
): NextResponse | null {
  const contentLength = request.headers.get('content-length');
  
  // If Content-Length header is present, check it
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    
    // Validate the parsed size
    if (isNaN(size) || size < 0) {
      // Invalid Content-Length header
      return createUserError(
        'Invalid request size.',
        400
      );
    }
    
    // Check if size exceeds limit
    if (size > maxSize) {
      return createUserError(
        'Request body too large. Please reduce the size of your request.',
        413 // Payload Too Large
      );
    }
  }
  
  // If Content-Length is missing, we can't check ahead of time
  // But we'll still try to parse and handle errors during parsing
  // This is acceptable because:
  // 1. Most clients send Content-Length
  // 2. Next.js has its own body size limits
  // 3. We'll catch errors during JSON parsing if body is too large
  
  return null; // Size OK or unknown (will be handled during parsing)
}

/**
 * Get body size limit for a specific route path
 */
export function getBodySizeLimit(path: string): number {
  // Match route patterns
  if (path.includes('/api/create-order')) {
    return BODY_SIZE_LIMITS.CREATE_ORDER;
  }
  
  if (path.includes('/api/calculate-price')) {
    return BODY_SIZE_LIMITS.CALCULATE_PRICE;
  }
  
  if (path.includes('/api/admin/login')) {
    return BODY_SIZE_LIMITS.ADMIN_LOGIN;
  }
  
  if (path.includes('/api/admin/orders') && path.includes('/route')) {
    // This is the list endpoint (GET only, no body)
    return BODY_SIZE_LIMITS.DEFAULT;
  }
  
  if (path.includes('/api/admin/orders/[')) {
    // This is the [orderId] endpoint (PATCH)
    return BODY_SIZE_LIMITS.ADMIN_ORDER_UPDATE;
  }
  
  if (path.includes('/api/upload-design')) {
    return BODY_SIZE_LIMITS.UPLOAD_DESIGN;
  }
  
  if (path.includes('/api/get-order')) {
    // GET request, no body
    return BODY_SIZE_LIMITS.DEFAULT;
  }
  
  // Default limit
  return BODY_SIZE_LIMITS.DEFAULT;
}




