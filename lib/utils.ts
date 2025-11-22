/**
 * Format currency in Malaysian Ringgit
 */
export function formatCurrency(amount: number): string {
  return `RM ${amount.toFixed(2)}`;
}

/**
 * Format phone number (Malaysian format)
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Format as +60 X-XXX XXXX or 0X-XXX XXXX
  if (digits.startsWith('60')) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 3)}-${digits.slice(3, 6)} ${digits.slice(6)}`;
  } else if (digits.startsWith('0')) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)} ${digits.slice(5)}`;
  }
  return phone;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Malaysian)
 */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  // Malaysian phone: 10-11 digits (with or without country code)
  return digits.length >= 10 && digits.length <= 13;
}

/**
 * Validate file type for design upload
 */
export function isValidDesignFile(file: File): boolean {
  const allowedTypes = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'application/pdf',
    'image/svg+xml',
  ];
  return allowedTypes.includes(file.type);
}

/**
 * Validate file size (max 10MB)
 */
export function isValidFileSize(file: File, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}









