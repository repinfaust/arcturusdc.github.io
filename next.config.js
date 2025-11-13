/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
  },
  
  webpack: (config, { isServer }) => {
    // Ensure stripe is properly resolved
    if (isServer) {
      config.externals = config.externals || [];
      // Don't externalize stripe for server-side
    }
    return config;
  }
};

module.exports = nextConfig;
