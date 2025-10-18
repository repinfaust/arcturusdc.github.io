/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: [
      'jest',
      'jest-cli',
      'jest-util',
      'ts-jest',
      '@jest/types',
      '@jest/console',
      '@jest/reporters',
      '@jest/transform',
      'babel-jest',
      '@babel/core',
      'chalk',
      'graceful-fs',
      'glob',
    ],
    outputFileTracingIncludes: {
      '/api/run-tests': [
        './scripts/run-jest-tests.js',
        './node_modules/jest/**/*',
        './node_modules/jest-cli/**/*',
        './node_modules/jest-util/**/*',
        './node_modules/@jest/**/*',
        './node_modules/ts-jest/**/*',
        './node_modules/@types/jest/**/*',
        './node_modules/babel-jest/**/*',
        './node_modules/@babel/**/*',
        './node_modules/chalk/**/*',
        './node_modules/graceful-fs/**/*',
        './node_modules/glob/**/*',
        './node_modules/ansi-styles/**/*',
        './node_modules/supports-color/**/*',
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
