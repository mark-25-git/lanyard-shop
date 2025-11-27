/**
 * Generate tracking URL from template and tracking number
 * @param template - URL template with {tracking_number} placeholder
 * @param trackingNumber - Actual tracking number
 * @returns Full tracking URL
 */
export function generateTrackingUrl(template: string, trackingNumber: string): string {
  return template.replace('{tracking_number}', encodeURIComponent(trackingNumber));
}

/**
 * Extract tracking number from a full tracking URL
 * Useful for reverse lookup or validation
 */
export function extractTrackingNumberFromUrl(url: string, template: string): string | null {
  // Simple extraction - replace template pattern with regex pattern
  const regexPattern = template.replace('{tracking_number}', '([^&?]+)');
  const regex = new RegExp(regexPattern);
  const match = url.match(regex);
  return match ? match[1] : null;
}

