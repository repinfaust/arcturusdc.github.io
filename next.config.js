/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingIncludes: {
      '/api/run-tests': [
        './scripts/run-jest-tests.js',
        './node_modules/jest/**',
        './node_modules/@jest/**',
        './node_modules/ts-jest/**',
        './node_modules/@types/jest/**',
        './node_modules/babel-jest/**',
        './node_modules/typescript/**',
      ],
    },
  },

  // DO NOT set output: 'export' — that would disable API routes
  // output: undefined,

  // No rewrites that could steal /api/*
  async rewrites() {
    return [];
  },

  // Optional: security headers (HSTS lives in your middleware already)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
