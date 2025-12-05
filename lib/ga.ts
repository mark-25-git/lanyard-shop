export function trackEvent(action: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  if (!window.gtag) {
    console.warn('GA4: gtag not available');
    return;
  }

  // Debug logging (remove in production if desired)
  if (process.env.NODE_ENV === 'development') {
    console.log('GA4 Event:', action, params);
  }

  window.gtag('event', action, params || {});
}



