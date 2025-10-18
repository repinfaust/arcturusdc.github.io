/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Ensure App Router is enabled (harmless if already default)
  experimental: {
    appDir: true,
  },

  // DO NOT set output: 'export' — that would disable API routes
  // output: undefined,

  // No rewrites that could steal /api/*
  async rewrites() {
    return [];
  },

  // Optional: security headers (HSTS) — middleware already forces HTTPS
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
