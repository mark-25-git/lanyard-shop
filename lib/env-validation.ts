/**
 * Environment variable validation
 * Validates required environment variables at startup
 * Fails fast with clear error messages if any are missing
 */

interface EnvValidationResult {
  isValid: boolean;
  missing: string[];
  errors: string[];
}

// Cache validation result to avoid re-checking on every request
let validationCache: EnvValidationResult | null = null;

/**
 * Required environment variables for the application
 */
const REQUIRED_ENV_VARS = {
  // Supabase - Critical for database operations
  NEXT_PUBLIC_SUPABASE_URL: {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    description: 'Supabase project URL',
    required: true,
  },
  NEXT_PUBLIC_SUPABASE_ANON_KEY: {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    description: 'Supabase anonymous key',
    required: true,
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    description: 'Supabase service role key (for server-side operations)',
    required: true,
  },
  // Payment - Required for checkout flow
  NEXT_PUBLIC_BANK_ACCOUNT: {
    name: 'NEXT_PUBLIC_BANK_ACCOUNT',
    description: 'Bank account number for payments',
    required: true,
  },
  // Admin - Required for admin authentication
  NEXT_PUBLIC_ADMIN_EMAIL: {
    name: 'NEXT_PUBLIC_ADMIN_EMAIL',
    description: 'Admin email address for authentication',
    required: true,
  },
} as const;

/**
 * Optional environment variables (have fallbacks)
 */
const OPTIONAL_ENV_VARS = {
  NEXT_PUBLIC_BANK_NAME: 'MAYBANK',
  NEXT_PUBLIC_BANK_ACCOUNT_NAME: 'Teevent Enterprise',
  NEXT_PUBLIC_SITE_URL: 'https://teevent.my',
  GOOGLE_SERVICE_ACCOUNT_PATH: 'config/google-service-account.json',
  GOOGLE_DRIVE_FOLDER_ID: undefined, // Only needed if using file uploads
  NEXT_PUBLIC_CANVA_TEMPLATE_URL: undefined,
  NEXT_PUBLIC_AI_TEMPLATE_URL: undefined,
  NEXT_PUBLIC_PS_TEMPLATE_URL: undefined,
} as const;

/**
 * Validate a single environment variable
 */
function validateEnvVar(
  varName: keyof typeof REQUIRED_ENV_VARS
): { isValid: boolean; error?: string } {
  const config = REQUIRED_ENV_VARS[varName];
  const value = process.env[config.name];

  if (!value || value.trim() === '') {
    return {
      isValid: false,
      error: `${config.name} is required. ${config.description}`,
    };
  }

  // Additional validation for specific variables
  if (varName === 'NEXT_PUBLIC_SUPABASE_URL') {
    try {
      new URL(value);
    } catch {
      return {
        isValid: false,
        error: `${config.name} must be a valid URL`,
      };
    }
  }

  if (varName === 'NEXT_PUBLIC_ADMIN_EMAIL') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return {
        isValid: false,
        error: `${config.name} must be a valid email address`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Validate all required environment variables
 * Returns cached result if already validated
 */
export function validateEnvironment(): EnvValidationResult {
  // Return cached result if available
  if (validationCache !== null) {
    return validationCache;
  }

  const missing: string[] = [];
  const errors: string[] = [];

  // Check all required variables
  for (const varName of Object.keys(REQUIRED_ENV_VARS) as Array<
    keyof typeof REQUIRED_ENV_VARS
  >) {
    const result = validateEnvVar(varName);
    if (!result.isValid) {
      missing.push(varName);
      if (result.error) {
        errors.push(result.error);
      }
    }
  }

  const isValid = missing.length === 0;

  // Cache the result
  validationCache = {
    isValid,
    missing,
    errors,
  };

  return validationCache;
}

/**
 * Get formatted error message for missing environment variables
 */
export function getEnvValidationErrorMessage(): string {
  const result = validateEnvironment();

  if (result.isValid) {
    return '';
  }

  const errorMessages = [
    'Missing or invalid required environment variables:',
    '',
    ...result.errors,
    '',
    'Please check your .env.local file and ensure all required variables are set.',
    'See SETUP.md for configuration instructions.',
  ];

  return errorMessages.join('\n');
}

/**
 * Throw error if environment validation fails
 * Use this at application startup
 */
export function requireEnvironment(): void {
  const result = validateEnvironment();

  if (!result.isValid) {
    const errorMessage = getEnvValidationErrorMessage();
    throw new Error(errorMessage);
  }
}

/**
 * Check if a specific environment variable is set
 */
export function hasEnvVar(varName: string): boolean {
  const value = process.env[varName];
  return value !== undefined && value.trim() !== '';
}

/**
 * Get environment variable with validation
 */
export function getRequiredEnvVar(varName: keyof typeof REQUIRED_ENV_VARS): string {
  const config = REQUIRED_ENV_VARS[varName];
  const value = process.env[config.name];

  if (!value || value.trim() === '') {
    throw new Error(
      `Required environment variable ${config.name} is not set. ${config.description}`
    );
  }

  return value;
}




