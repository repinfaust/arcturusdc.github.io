export const dynamic = 'force-dynamic'; // or use revalidate as above

export default function sitemap() {
  const base = 'https://www.arcturusdc.com';
  const now = new Date();

  const paths = [
    '',                // /
    '/apps',
    '/capabilities',   // (if you still want this)
    '/privacy',
    '/terms',
    '/contact',        // <- this will show once cache is busted
  ];

  return paths.map(p => ({
    url: base + p,
    lastModified: now,
    changefreq: (p === '/privacy' || p === '/terms') ? 'yearly' : 'weekly',
    priority: p === '' ? 1.0 : 0.7,
  }));
}
