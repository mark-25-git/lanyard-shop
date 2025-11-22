import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateEnvironment, getEnvValidationErrorMessage } from './lib/env-validation';

// Cache validation result per request cycle
let hasValidated = false;

export async function middleware(req: NextRequest) {
  // Validate environment variables on first request (cached after that)
  if (!hasValidated) {
    const validation = validateEnvironment();
    if (!validation.isValid) {
      // Only log error in development, fail silently in production to avoid exposing config
      if (process.env.NODE_ENV === 'development') {
        console.error('\n❌ Environment Validation Failed:\n');
        console.error(getEnvValidationErrorMessage());
        console.error('\n');
      }
      // In production, we still allow requests but log the error
      // The app will fail when trying to use missing variables
    }
    hasValidated = true;
  }

  // Check if route is admin route
  if (req.nextUrl.pathname.startsWith('/admin')) {
    // Skip auth check for login page
    if (req.nextUrl.pathname === '/admin/login') {
      return NextResponse.next();
    }

    // Note: We're not checking cookies here because Supabase stores sessions in localStorage
    // on the client side. The client-side code in each admin page will handle authentication.
    // This middleware is kept for potential future server-side session checks.
    // For now, we let all requests through and let the client-side handle auth.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

