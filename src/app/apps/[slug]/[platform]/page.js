import apps from '@/data/apps.json';

export async function generateStaticParams() {
  const params = [];
  for (const [slug, app] of Object.entries(apps)) {
    if (!app.platforms) continue;
    for (const p of Object.keys(app.platforms)) params.push({ slug, platform: p });
  }
  return params;
}

export default function PlatformPage({ params }) {
  const app = apps[params.slug];
  const platform = app?.platforms?.[params.platform];
  if (!app || !platform) return notFound();

  return (
    <main className="py-10">
      <a href={`/apps/${params.slug}`} className="text-sm text-muted hover:text-brand">← {app.name}</a>
      <h1 className="mt-3 text-3xl font-extrabold">{app.name} — {platform.title}</h1>

      {platform.policies?.length ? (
        <ul className="mt-6 space-y-3">
          {platform.policies.map((p, i) => (
            <li key={i}>
              <a className="inline-flex items-center gap-2 px-4 py-2 rounded-full border hover:border-brand"
                 href={p.href} target="_blank" rel="noopener noreferrer">
                <span className="i tabular-nums">📄</span>{p.label}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 text-muted">Policies coming soon.</p>
      )}
    </main>
  );
}

function notFound() {
  return <main className="py-10"><h1 className="text-2xl font-bold">Page not found.</h1></main>;
}
