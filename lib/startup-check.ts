/**
 * Startup validation check
 * This module validates environment variables when imported
 * Import this in a critical path to ensure validation runs early
 */

import { requireEnvironment } from './env-validation';

/**
 * Run environment validation on module load
 * This ensures validation happens early in the application lifecycle
 */
try {
  // Only validate in production or when explicitly enabled
  // In development, we allow the app to start and show errors in middleware
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_ENV_VALIDATION === 'true') {
    requireEnvironment();
  }
} catch (error) {
  // Log error but don't throw (Next.js will handle it)
  if (error instanceof Error) {
    console.error('\n❌ Environment Validation Failed:\n');
    console.error(error.message);
    console.error('\n');
  }
}




