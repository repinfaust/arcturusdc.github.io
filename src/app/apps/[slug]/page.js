import apps from '@/data/apps.json';

export async function generateStaticParams() {
  return Object.keys(apps).map(slug => ({ slug }));
}

export default function AppOverview({ params }) {
  const app = apps[params.slug];
  if (!app) return notFound();

  const platforms = app.platforms ? Object.keys(app.platforms) : [];
  const policies = app.policies || [];

  return (
    <main className="py-10">
      <a href="/apps" className="text-sm text-muted hover:text-brand">← Back to apps</a>
      
      <div className="mt-4 flex items-center gap-4">
        {app.icon ? (
          <img
            src={app.icon}
            alt={`${app.name} logo`}
            className="w-14 h-14 rounded-xl"
          />
        ) : null}
        <h1 className="text-3xl font-extrabold">{app.name}</h1>
      </div>
      <p className="mt-2 text-muted">{app.tagline}</p>

      {platforms.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-3">
          {platforms.map((p) => (
            <a
              key={p}
              href={`/apps/${params.slug}/${p}`}
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
