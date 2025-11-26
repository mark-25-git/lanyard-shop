/**
 * Input sanitization utilities to prevent XSS attacks
 * Sanitizes user input before database insertion
 */

/**
 * Remove HTML tags and scripts from string
 */
function stripHtml(html: string): string {
  if (typeof html !== 'string') {
    return '';
  }
  
  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, '');
  
  // Remove script tags and their content
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove style tags and their content
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove event handlers (onclick, onerror, etc.)
  text = text.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  return text;
}

/**
 * Escape special characters for safe database storage
 */
function escapeSpecialChars(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }
  
  // Escape HTML entities
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize text input (names, addresses, etc.)
 */
export function sanitizeText(input: string | null | undefined, maxLength?: number): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Trim whitespace
  let sanitized = input.trim();
  
  // Remove HTML tags
  sanitized = stripHtml(sanitized);
  
  // Limit length if specified
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email || typeof email !== 'string') {
    return '';
  }
  
  // Trim and lowercase
  let sanitized = email.trim().toLowerCase();
  
  // Remove HTML tags
  sanitized = stripHtml(sanitized);
  
  // Basic email validation (simple check)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return '';
  }
  
  // Limit length
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 255);
  }
  
  return sanitized;
}

/**
 * Sanitize phone number
 */
export function sanitizePhone(phone: string | null | undefined): string {
  if (!phone || typeof phone !== 'string') {
    return '';
  }
  
  // Remove all non-digit characters except +, -, spaces, and parentheses
  let sanitized = phone.replace(/[^\d+\-() ]/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length
  if (sanitized.length > 50) {
    sanitized = sanitized.substring(0, 50);
  }
  
  return sanitized;
}

/**
 * Sanitize postal code
 */
export function sanitizePostalCode(postalCode: string | null | undefined): string {
  if (!postalCode || typeof postalCode !== 'string') {
    return '';
  }
  
  // Remove all non-alphanumeric characters
  let sanitized = postalCode.replace(/[^a-zA-Z0-9]/g, '');
  
  // Trim and uppercase
  sanitized = sanitized.trim().toUpperCase();
  
  // Limit length
  if (sanitized.length > 20) {
    sanitized = sanitized.substring(0, 20);
  }
  
  return sanitized;
}

/**
 * Sanitize URL (for design_file_url)
 */
export function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }
  
  // Trim
  let sanitized = url.trim();
  
  // Remove HTML tags
  sanitized = stripHtml(sanitized);
  
  // If empty after sanitization, return null
  if (!sanitized) {
    return null;
  }
  
  // Basic URL validation
  try {
    // If URL doesn't have a protocol, add https://
    if (!sanitized.match(/^https?:\/\//i)) {
      sanitized = `https://${sanitized}`;
    }
    
    const urlObj = new URL(sanitized);
    // Only allow http and https protocols
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return null;
    }
    return sanitized;
  } catch {
    // Invalid URL - return null
    return null;
  }
}

/**
 * Sanitize address object
 */
export function sanitizeAddress(address: any): any {
  if (!address || typeof address !== 'object') {
    return null;
  }
  
  return {
    name: sanitizeText(address.name, 200),
    email: sanitizeEmail(address.email),
    phone: sanitizePhone(address.phone),
    address_line1: sanitizeText(address.address_line1, 200),
    address_line2: address.address_line2 ? sanitizeText(address.address_line2, 200) : null,
    city: sanitizeText(address.city, 100),
    state: sanitizeText(address.state, 100),
    postal_code: sanitizePostalCode(address.postal_code),
    country: sanitizeText(address.country || 'Malaysia', 100),
  };
}

/**
 * Sanitize payment reference
 */
export function sanitizePaymentReference(ref: string | null | undefined): string | null {
  if (!ref || typeof ref !== 'string') {
    return null;
  }
  
  // Remove HTML tags
  let sanitized = stripHtml(ref.trim());
  
  // Limit length
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100);
  }
  
  return sanitized || null;
}




