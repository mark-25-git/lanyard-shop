/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['awfjwgppfhdoezmlithi.supabase.co'],
  },
  async headers() {
    // Only apply strict security headers in production
    // In development, these can cause issues when accessing from network devices
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (!isProduction) {
      // In development, return minimal headers for easier debugging
      return [
        {
          source: '/:path*',
          headers: [
            // Basic security headers only (no strict CSP)
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
          ],
        },
      ];
    }
    
    // Production: Full security headers
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Allow Next.js scripts plus Google Analytics / Tag Manager
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net", // Bootstrap Icons CSS
              "font-src 'self' https://cdn.jsdelivr.net data:", // Bootstrap Icons fonts
              "img-src 'self' data: https: blob:", // Images from any HTTPS source
              // Supabase API + Google Analytics beacons
              "connect-src 'self' https://*.supabase.co https://*.supabase.in https://www.google-analytics.com https://www.googletagmanager.com",
              "frame-src 'self'", // Allow same-origin iframes only
              "object-src 'none'", // Block plugins
              "base-uri 'self'", // Restrict base tag
              "form-action 'self'", // Form submissions to same origin
              "frame-ancestors 'none'", // Prevent embedding (same as X-Frame-Options)
              "upgrade-insecure-requests", // Upgrade HTTP to HTTPS
            ].join('; '),
          },
          // Strict Transport Security (HSTS)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // Referrer Policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // X-Frame-Options (redundant with CSP frame-ancestors, but for older browsers)
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // X-Content-Type-Options
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // X-XSS-Protection (legacy, but still useful)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Permissions Policy
          {
            key: 'Permissions-Policy',
            value: [
              'geolocation=()',
              'microphone=()',
              'camera=()',
              'payment=()',
              'usb=()',
              'magnetometer=()',
              'gyroscope=()',
              'accelerometer=()',
            ].join(', '),
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig




