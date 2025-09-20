// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async rewrites() {
    return [
      // Short paths like /mandrake/android -> /apps/mandrake/android
      {
        source: "/:slug(mandrake|syncfit|adhd-acclaim|toume)/:platform(android|ios)",
        destination: "/apps/:slug/:platform",
      },

      // Optional legacy: /mandrake/android -> /apps/mandrake/android (explicit)
      {
        source: "/mandrake/:platform(android|ios)",
        destination: "/apps/mandrake/:platform",
      },
    ];
  },
};

module.exports = nextConfig;
