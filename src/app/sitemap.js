export const dynamic = 'force-dynamic';

export default function sitemap() {
  const base = 'https://www.arcturusdc.com';
  const now = new Date();

  const paths = [
    '',
    '/portfolio',
    '/portfolio/ai',
    '/portfolio/b2b',
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
    '/apps/dialled-mtb/changelog',
    '/apps/dialled-mtb/changelog/timeline',
    '/apps/rehabpath',
    '/apps/rehabpath/privacy-policy',
    '/apps/rehabpath/terms-of-use',
    '/apps/rehabpath/delete-account',
    '/apps/assumezero',
    '/apps/apex-state',
    '/apps/apex-state/privacy-policy',
    '/apps/apex-state/terms-of-use',
    '/apps/apex-state/delete-account',
    '/apps/familygrill',
  ];

  return paths.map((p) => ({
    url: base + p,
    lastModified: now,
    changefreq: (p === '/privacy' || p === '/terms') ? 'yearly' : 'weekly',
    priority: p === '' ? 1.0 : p.startsWith('/apps/') && p !== '/apps' ? 0.8 : 0.7,
  }));
}
