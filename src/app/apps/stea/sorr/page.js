import Link from 'next/link';

export const metadata = {
  title: 'SoRR - STEa',
  description: 'SoRR Control entry point in STEa.',
};

export default function SorrIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-slate-900">SoRR</h1>
      <p className="mt-2 text-slate-600">System of Record for Reasoning control surfaces.</p>
      <Link
        href="/apps/stea/sorr/controlui"
        className="mt-6 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
      >
        Open Control UI
      </Link>
    </div>
  );
}
