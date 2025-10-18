/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingIncludes: {
      '/api/run-tests': [
        './scripts/run-jest-tests.js',
        './__tests__/**/*',
        './node_modules/jest-cli/**/*',
        './node_modules/jest-worker/**/*',
        './node_modules/jest-config/**/*',
        './node_modules/jest-resolve/**/*',
        './node_modules/@jest/**/*',
        './node_modules/yargs/**/*',
        './node_modules/y18n/**/*',
      ],
    },
  },

  async rewrites() {
    return [];
  },

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
