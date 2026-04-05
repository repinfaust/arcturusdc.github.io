export const dynamic = 'force-dynamic';

export default function sitemap() {
  const base = 'https://www.arcturusdc.com';
  const now = new Date();

  const paths = [
    '',
    '/apps',
    '/apps/stea',
    '/apps/stea/explore',
    '/apps/stea/orbit/overview',
    '/apps/sorr',
    '/capabilities',
    '/product-strategy',
    '/privacy',
    '/terms',
    '/contact',
    '/apps/mandrake',
    '/apps/syncfit',
    '/apps/adhd-acclaim',
    '/apps/toume',
    '/apps/unload',
    '/apps/sprocket',
    '/apps/dialled-mtb',
    '/apps/rehabpath',
    '/apps/assumezero',
    '/apps/apex-twin',
    '/apps/familygrill',
  ];

  return paths.map((p) => ({
    url: base + p,
    lastModified: now,
    changefreq: (p === '/privacy' || p === '/terms') ? 'yearly' : 'weekly',
    priority: p === '' ? 1.0 : p.startsWith('/apps/') && p !== '/apps' ? 0.8 : 0.7,
  }));
}
