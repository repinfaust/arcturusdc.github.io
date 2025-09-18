import AppCard from '@/components/AppCard';
import apps from '@/data/apps.json';

export const metadata = {
  title: 'Apps — ArcturusDC',
  description: 'Find policies and platform specifics for each app.',
};

export default function Apps() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900">Apps</h1>
      <p className="mt-2 text-neutral-600">Find policies and platform specifics for each app.</p>
      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {apps.apps.map(a => <AppCard key={a.slug} app={a} />)}
      </div>
    </main>
  );
}
