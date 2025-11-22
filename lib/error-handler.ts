import { NextRequest, NextResponse } from 'next/server';
import { addCorsHeaders } from './cors';
import { logError } from './logger';

/**
 * Generic error messages for users
 */
const ERROR_MESSAGES = {
  SERVER_ERROR: 'Something went wrong. Please try again later.',
  AUTH_ERROR: 'Invalid credentials.',
  ACCESS_DENIED: 'Access denied.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Invalid request. Please check your input.',
  RATE_LIMIT: 'Too many requests. Please try again later.',
} as const;

/**
 * Create a user-friendly error response (400-level)
 * Use for validation errors, missing fields, etc.
 */
export function createUserError(
  message: string,
  status: number = 400,
  request?: NextRequest
): NextResponse {
  const response = NextResponse.json(
    { error: message },
    { status }
  );

  return request ? addCorsHeaders(request, response) : response;
}

/**
 * Create a generic server error response (500-level)
 * Never expose internal error details to users
 */
export function createServerError(
  request?: NextRequest,
  internalError?: unknown
): NextResponse {
  // Log the actual error server-side (for debugging)
  if (internalError) {
    logError('Server error', internalError);
  }

  const response = NextResponse.json(
    { error: ERROR_MESSAGES.SERVER_ERROR },
    { status: 500 }
  );

  return request ? addCorsHeaders(request, response) : response;
}

/**
 * Create an authentication error response (401)
 */
export function createAuthError(
  message: string = ERROR_MESSAGES.AUTH_ERROR,
  request?: NextRequest
): NextResponse {
  const response = NextResponse.json(
    { error: message },
    { status: 401 }
  );

  return request ? addCorsHeaders(request, response) : response;
}

/**
 * Create an access denied error response (403)
 */
export function createAccessDeniedError(
  request?: NextRequest
): NextResponse {
  const response = NextResponse.json(
    { error: ERROR_MESSAGES.ACCESS_DENIED },
    { status: 403 }
  );

  return request ? addCorsHeaders(request, response) : response;
}

/**
 * Create a not found error response (404)
 */
export function createNotFoundError(
  message: string = ERROR_MESSAGES.NOT_FOUND,
  request?: NextRequest
): NextResponse {
  const response = NextResponse.json(
    { error: message },
    { status: 404 }
  );

  return request ? addCorsHeaders(request, response) : response;
}

/**
 * Create a validation error response (400)
 */
export function createValidationError(
  message: string = ERROR_MESSAGES.VALIDATION_ERROR,
  request?: NextRequest
): NextResponse {
  return createUserError(message, 400, request);
}

/**
 * Handle API errors with proper categorization
 * Logs detailed errors server-side, returns generic messages to users
 */
export function handleApiError(
  error: unknown,
  request: NextRequest,
  context?: string
): NextResponse {
  // Log the error with context for debugging
  logError(context || 'API error', error);

  // Check if it's a known error type
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();

    // Database errors - always return generic message
    if (
      errorMessage.includes('database') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('pgrst') ||
      errorMessage.includes('supabase')
    ) {
      return createServerError(request, error);
    }

    // Validation errors - can be more specific but still user-friendly
    if (
      errorMessage.includes('validation') ||
      errorMessage.includes('invalid') ||
      errorMessage.includes('required')
    ) {
      return createValidationError(
        'Invalid request. Please check your input.',
        request
      );
    }
  }

  // Default: return generic server error
  return createServerError(request, error);
}

/**
 * Check if an error is a "not found" error
 * Handles Supabase PGRST116 and other common not-found patterns
 */
export function isNotFoundError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: string }).code;
    // Supabase PostgREST error code for not found
    if (code === 'PGRST116') {
      return true;
    }
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('not found') ||
      message.includes('does not exist') ||
      message.includes('no rows')
    );
  }

  return false;
}




