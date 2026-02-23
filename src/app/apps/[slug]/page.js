import apps from '@/data/apps.json';

const STATIC_APP_ROUTES = new Set([
  'mandrake',
  'adhd-acclaim',
  'syncfit',
  'assumezero',
  'toume',      // static page at /apps/toume
  // add any others you move to standalone pages
]);

export async function generateStaticParams() {
  // Only generate pages for apps that do NOT have a static route
  return apps
    .filter(a => !STATIC_APP_ROUTES.has(a.id))
    .map(a => ({ slug: a.id }));
}

export default function AppOverview({ params }) {
  const { slug } = params;

  // If this slug has a dedicated static page, don't render it here.
  if (STATIC_APP_ROUTES.has(slug)) return notFound();

  // Find the app by its id (slug)
  const app = apps.find(a => a.id === slug);
  if (!app) return notFound();

  const platforms = app.platforms ? Object.keys(app.platforms) : [];
  const policies = Array.isArray(app.policies) ? app.policies : [];

  return (
    <main className="py-10">
      <a href="/apps" className="text-sm text-muted hover:text-brand">← Back to apps</a>

      <div className="mt-4 flex items-center gap-4">
        {app.icon ? (
          <img
            src={app.icon}
            alt={`${app.name} logo`}
            className="w-14 h-14 rounded-xl"
            loading="lazy"
          />
        ) : null}
        <h1 className="text-3xl font-extrabold">{app.name}</h1>
      </div>

      {app.desc ? (
        <p className="mt-2 text-muted">{app.desc}</p>
      ) : app.tagline ? (
        <p className="mt-2 text-muted">{app.tagline}</p>
      ) : null}

      {platforms.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-3">
          {platforms.map((p) => (
            <a
              key={p}
              href={`/apps/${slug}/${p}`}
              className="px-3 py-2 rounded-full border hover:border-brand"
            >
              {app.platforms[p].title}
            </a>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-muted">Details coming soon.</p>
      )}

      {policies.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-2">Policies</h2>
          <ul className="list-disc pl-5 space-y-1">
            {policies.map((policy) => (
              <li key={policy.href}>
                <a
                  href={policy.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:underline"
                >
                  {policy.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}

function notFound() {
  return (
    <main className="py-10">
      <h1 className="text-2xl font-bold">App not found.</h1>
    </main>
  );
}
