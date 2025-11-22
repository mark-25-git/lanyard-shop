import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';
import { handleCorsPreflight, addCorsHeaders } from '@/lib/cors';
import {
  createUserError,
  createServerError,
  createAuthError,
  createAccessDeniedError,
} from '@/lib/error-handler';
import { checkBodySize, BODY_SIZE_LIMITS } from '@/lib/body-size-limit';
import { sanitizeEmail } from '@/lib/sanitize';

export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreflight(request);
  if (preflightResponse) {
    return preflightResponse;
  }

  // Check body size limit before parsing
  const sizeCheck = checkBodySize(request, BODY_SIZE_LIMITS.ADMIN_LOGIN);
  if (sizeCheck) {
    return addCorsHeaders(request, sizeCheck);
  }

  // Rate limiting - very strict for login (prevent brute force)
  const rateLimitResponse = rateLimit(request, 'login');
  if (rateLimitResponse) {
    return addCorsHeaders(request, rateLimitResponse);
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return createUserError('Email and password are required', 400, request);
    }

    // Sanitize email input
    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) {
      return createUserError('Invalid email format', 400, request);
    }

    const supabase = createServerClient();

    // Sign in with Supabase Auth (password is handled by Supabase, no need to sanitize)
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password: password,
    });

    if (authError || !data.user) {
      return createAuthError('Invalid email or password', request);
    }

    // Verify user is admin (check by email)
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    if (!adminEmail) {
      return createServerError(request, new Error('NEXT_PUBLIC_ADMIN_EMAIL is not configured'));
    }
    
    if (data.user.email !== adminEmail) {
      // Sign out if not admin
      await supabase.auth.signOut();
      return createAccessDeniedError(request);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        email: data.user.email,
      },
    });

    return addCorsHeaders(request, response);
  } catch (error) {
    return createServerError(request, error);
  }
}




