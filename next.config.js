// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // keep dynamic API routes working (DO NOT set output: 'export')
  async rewrites() {
    return [
      {
        // /mandrake/android -> /apps/mandrake/android (and similar)
        source: "/:slug(mandrake|syncfit|adhd-acclaim|toume)/:platform(android|ios)",
        destination: "/apps/:slug/:platform",
      },
      {
        // optional legacy form
        source: "/mandrake/:platform(android|ios)",
        destination: "/apps/mandrake/:platform",
      },
    ];
  },
};

module.exports = nextConfig;
