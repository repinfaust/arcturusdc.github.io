import apps from '@/data/apps.json';

export const metadata = { title: 'Apps — ArcturusDC' };

export default function AppsIndex() {
  const entries = Object.entries(apps);

  return (
    <main className="py-10">
      <h1 className="text-4xl font-extrabold mb-6">Apps</h1>
      <p className="text-muted mb-8">Find policies and platform specifics for each app.</p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map(([slug, app]) => (
          <a
            key={slug}
            href={`/apps/${slug}`}
            className="rounded-2xl border bg-white p-5 hover:shadow-soft transition"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-xl bg-neutral-200 overflow-hidden">
                {app.icon ? <img src={app.icon} alt="" className="w-full h-full object-cover" /> : null}
              </div>
              <div className="font-semibold text-lg">{app.name}</div>
            </div>
            <p className="text-sm text-muted">{app.tagline}</p>
          </a>
        ))}
      </div>
    </main>
  );
}
