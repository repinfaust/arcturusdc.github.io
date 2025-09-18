/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // keep your short paths working
      { source: '/:slug(android|syncfit|adhd-acclaim)/:platform(android|ios)', destination: '/apps/:slug/:platform' },
      // optional: legacy /mandrake -> apps/mandrake
      { source: '/mandrake/:platform(android|ios)', destination: '/apps/mandrake/:platform' },
    ];
  },
};
export default nextConfig;
