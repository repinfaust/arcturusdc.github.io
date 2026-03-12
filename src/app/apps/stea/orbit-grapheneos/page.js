import Link from 'next/link';

export default function OrbitGrapheneosPage() {
  return (
    <main className="min-h-screen bg-starburst flex items-center justify-center px-6">
      <div className="max-w-2xl w-full bg-white border border-neutral-200 rounded-2xl p-8 text-center">
        <h1 className="text-3xl font-bold text-neutral-900">Orbit GrapheneOS</h1>
        <p className="mt-3 text-neutral-600">
          Device Trust Layer PoC v2 with public demo tier and magic-link authenticated event posting.
        </p>
        <div className="mt-6">
          <Link
            href="/apps/stea/orbit-grapheneos/poc"
            className="inline-flex rounded-lg bg-neutral-900 text-white px-5 py-3 text-sm font-medium hover:bg-neutral-800"
          >
            Open PoC Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
