/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/stea/:path*',
        destination: '/apps/stea/:path*',
      },
    ];
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
  
  // Ensure API routes are not statically optimized
  experimental: {
    serverComponentsExternalPackages: ['stripe'],
  },
  
  // Ensure stripe is properly resolved
  webpack: (config) => {
    // Don't externalize stripe - let webpack bundle it
    return config;
  }
};

module.exports = nextConfig;
