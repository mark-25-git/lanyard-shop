import { createClient } from '@supabase/supabase-js';

// Get environment variables
// For client-side: NEXT_PUBLIC_* vars are injected by Next.js at build time
// For server-side: We validate when functions are called
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate env vars and show helpful error if missing
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = 
    '❌ Missing required environment variables:\n' +
    (!supabaseUrl ? '  - NEXT_PUBLIC_SUPABASE_URL\n' : '') +
    (!supabaseAnonKey ? '  - NEXT_PUBLIC_SUPABASE_ANON_KEY\n' : '') +
    '\nPlease check your .env.local file and ensure these variables are set.\n' +
    'See SETUP.md for configuration instructions.';
  
  // In development, show error in console
  if (process.env.NODE_ENV === 'development') {
    console.error(errorMessage);
  }
}

// Client-side Supabase client (for browser)
// Will work if env vars are set, will fail gracefully if not
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

// Server-side client with service role key (for admin operations)
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    throw new Error(
      'Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY. Please check your .env.local file.'
    );
  }
  
  if (!supabaseUrl) {
    throw new Error(
      'Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL. Please check your .env.local file.'
    );
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Server-side client with anon key (for auth operations and public reads)
export function createAuthClient() {
  if (!supabaseUrl) {
    throw new Error(
      'Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL. Please check your .env.local file.'
    );
  }
  
  if (!supabaseAnonKey) {
    throw new Error(
      'Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY. Please check your .env.local file.'
    );
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}




