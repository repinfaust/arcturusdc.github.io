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
  
  webpack: (config, { isServer, webpack }) => {
    if (isServer) {
      // Mark stripe as external so webpack doesn't try to bundle it
      config.externals = config.externals || [];
      config.externals.push('stripe');
    }
    return config;
  },
  
  // Ensure API routes are not statically optimized
  experimental: {
    serverComponentsExternalPackages: ['stripe'],
  }
};

module.exports = nextConfig;
