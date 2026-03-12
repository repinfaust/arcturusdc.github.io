import Link from 'next/link';

export default function OrbitCharityPage() {
  return (
    <main className="min-h-screen bg-starburst flex items-center justify-center px-6">
      <div className="max-w-2xl w-full bg-white border border-neutral-200 rounded-2xl p-8 text-center">
        <h1 className="text-3xl font-bold text-neutral-900">Orbit Charity</h1>
        <p className="mt-3 text-neutral-600">
          Multi-role donor, volunteer, service-user consent and audit trail POC for charity organisations.
        </p>
        <div className="mt-6">
          <Link
            href="/apps/stea/orbit-charity/poc"
            className="inline-flex rounded-lg bg-neutral-900 text-white px-5 py-3 text-sm font-medium hover:bg-neutral-800"
          >
            Open Charity PoC Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
