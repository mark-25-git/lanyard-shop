import { createAuthClient } from './supabase';
import { NextRequest, NextResponse } from 'next/server';
import { logError } from './logger';

/**
 * Get authenticated admin user from request
 * Returns null if not authenticated or not admin
 */
export async function getAdminUser(request: NextRequest) {
  try {
    // Get access token from Authorization header
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');
    
    if (!accessToken) {
      return null;
    }

    const supabase = createAuthClient();
    
    // Verify token and get user
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return null;
    }

    // Verify user is admin (check by email)
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
    if (adminEmail && user.email !== adminEmail) {
      return null;
    }

    return user;
  } catch (error) {
    logError('Auth check error', error);
    return null;
  }
}

/**
 * Verify admin authentication in API routes
 * Returns error response if not authenticated
 */
export async function requireAdmin(request: NextRequest) {
  const user = await getAdminUser(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized. Please log in.' },
      { status: 401 }
    );
  }
  
  return user;
}

