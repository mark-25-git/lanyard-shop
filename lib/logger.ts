/**
 * Production-safe logging utility
 * Only logs in development, sanitizes sensitive data in production
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Sanitize data to remove sensitive information
 */
function sanitize(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'key',
    'email',
    'phone',
    'address',
    'order_number',
    'folder_id',
    'client_email',
    'service_account',
  ];

  if (Array.isArray(data)) {
    return data.map(item => sanitize(item));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(sk => lowerKey.includes(sk));

    if (isSensitive && !isDevelopment) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitize(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Log error (only in development, or sanitized in production)
 */
export function logError(message: string, error?: any) {
  if (isDevelopment) {
    console.error(message, error);
  } else {
    // In production, only log error message, sanitize any data
    console.error(message, error ? sanitize(error) : '');
  }
}

/**
 * Log warning (only in development)
 */
export function logWarning(message: string, data?: any) {
  if (isDevelopment) {
    console.warn(message, data);
  }
}

/**
 * Log info (only in development)
 */
export function logInfo(message: string, data?: any) {
  if (isDevelopment) {
    console.log(message, data);
  }
}

/**
 * Log debug (only in development)
 */
export function logDebug(message: string, data?: any) {
  if (isDevelopment) {
    console.log(`[DEBUG] ${message}`, data);
  }
}




