/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [100, 75],
  },
  turbopack: {
    resolveAlias: {
      canvas: "./src/lib/shims/canvas.js",
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      canvas: false,
    };

    return config;
  },
  async headers() {
    const isProduction = process.env.NODE_ENV === "production";

    // OpenReplay: derive ingest origin only when env is configured.
    // Avoids broad wildcards in CSP.
    let openReplayOrigin = null;
    const openReplayIngest = process.env.NEXT_PUBLIC_OPENREPLAY_INGEST_URL;
    if (openReplayIngest && openReplayIngest.trim().length > 0) {
      try {
        openReplayOrigin = new URL(openReplayIngest).origin;
      } catch {
        openReplayOrigin = null;
      }
    }

    const cspConnectSrc = [
      "'self'",
      "https://*.supabase.co",
      "wss://*.supabase.co",
      "https://*.mux.com",
      "https://live.dodopayments.com",
      "https://test.dodopayments.com",
    ];

    if (!isProduction) {
      cspConnectSrc.push("ws://localhost:*", "http://localhost:*");
    }

    const cspScriptSrc = [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      "https://www.gstatic.com",
    ];

    cspConnectSrc.push("https://inferred.litix.io");

    const cspImgSrc = ["'self'", "data:", "blob:", "https:"];

    if (openReplayOrigin) {
      cspConnectSrc.push(openReplayOrigin);
      cspScriptSrc.push(openReplayOrigin);
      cspImgSrc.push(openReplayOrigin);
    }

    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      `img-src ${cspImgSrc.join(" ")}`,
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      `script-src ${cspScriptSrc.join(" ")}`,
      "worker-src 'self' blob:",
      `connect-src ${cspConnectSrc.join(" ")}`,
      "frame-src 'self' blob: https://*.supabase.co https://*.mux.com https://*.dodopayments.com https://open.spotify.com",
      "media-src 'self' blob: https:",
      isProduction ? "upgrade-insecure-requests" : "",
    ]
      .filter(Boolean)
      .join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
