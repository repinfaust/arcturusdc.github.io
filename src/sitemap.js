export default async function sitemap() {
  const base = 'https://www.arcturusdc.com';
  const routes = ['', '/apps', '/privacy', '/terms', '/contact', '/product-strategy'].map(p => ({
    url: base + p,
    lastModified: new Date(),
    changefreq: 'weekly',
    priority: p === '' ? 1.0 : 0.7,
  }));
  return routes;
}
