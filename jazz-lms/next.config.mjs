/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  images: {
    unoptimized: true
  },
  async headers() {
    const isProduction = process.env.NODE_ENV === 'production';

    const cspConnectSrc = [
      "'self'",
      'https://*.supabase.co',
      'wss://*.supabase.co',
      'https://*.mux.com',
      'https://api.stripe.com',
      'https://*.stripe.com',
    ];

    if (!isProduction) {
      cspConnectSrc.push('ws://localhost:*', 'http://localhost:*');
    }

    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      `connect-src ${cspConnectSrc.join(' ')}`,
      "frame-src 'self' blob: https://*.supabase.co https://*.mux.com https://js.stripe.com https://hooks.stripe.com https://*.stripe.com",
      "media-src 'self' blob: https:",
      isProduction ? 'upgrade-insecure-requests' : '',
    ]
      .filter(Boolean)
      .join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy,
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
