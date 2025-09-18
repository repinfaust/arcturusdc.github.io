import Link from 'next/link';

export const metadata = {
  title: 'Arcturus Digital Consulting',
  description: 'Pragmatic product, apps, and privacy-first delivery for regulated environments.',
};

export default function Home() {
  return (
    <main className="relative">
      {/* Starburst corner motif */}
      <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(80%_60%_at_100%_0%,#0000_35%,#000_60%)]">
        <div className="absolute -top-24 right-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(255,68,34,0.18),transparent_60%)]" />
      </div>

      <section className="mx-auto max-w-6xl px-4 pt-14">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white border border-neutral-200/70 p-8 shadow-sm">
            <p className="text-xs font-semibold text-red-600 mb-3">Product & Apps</p>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-900">Software that ships.</h1>
            <p className="mt-3 text-neutral-600 max-w-prose">
              Pragmatic product, apps, and privacy-first delivery for regulated environments.
            </p>

            <div className="mt-5 flex gap-3">
              <Link href="/apps" className="inline-flex items-center rounded-xl bg-red-600 px-4 py-2 text-white font-medium shadow hover:bg-red-700">
                Explore apps
              </Link>
              <Link href="/product-strategy" className="inline-flex items-center rounded-xl border border-neutral-300 px-4 py-2 text-neutral-800 hover:bg-neutral-50">
                Capabilities
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 text-sm">
              <span className="inline-flex items-center rounded-full border px-3 py-1 text-neutral-700">UK Ltd</span>
              <span className="inline-flex items-center rounded-full border px-3 py-1 text-neutral-700">App Store & Google Play compliant</span>
              <span className="inline-flex items-center rounded-full border px-3 py-1 text-neutral-700">UK based</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-neutral-200/70 p-8 shadow-sm flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 size-16 rounded-2xl bg-[conic-gradient(from_0deg,rgba(255,68,34,.25),transparent_60%)] ring-1 ring-neutral-200" />
              <h2 className="text-2xl font-semibold text-neutral-900">ArcturusDC</h2>
              <p className="text-neutral-600">Clarity over clutter. Outcomes over theatre.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-neutral-200/70 bg-white shadow-sm p-6">
          <h3 className="text-xl font-bold text-neutral-900 mb-4">Capabilities</h3>
          <div className="grid md:grid-cols-3 gap-6 text-neutral-700">
            <div>
              <div className="text-xs font-semibold text-neutral-500 mb-1">PS</div>
              <h4 className="font-semibold text-neutral-900">Product strategy</h4>
              <p className="text-sm text-neutral-600">Find and ship the next most valuable thing.</p>
              <Link href="/product-strategy" className="mt-2 inline-block text-sm text-red-700 hover:underline">Learn more</Link>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border px-2 py-1">Discovery</span>
                <span className="rounded-full border px-2 py-1">Compliance support</span>
                <span className="rounded-full border px-2 py-1">Delivery ops</span>
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-neutral-500 mb-1">AD</div>
              <h4 className="font-semibold text-neutral-900">App development</h4>
              <p className="text-sm text-neutral-600">Android & iOS with privacy-first design.</p>
            </div>
            <div>
              <div className="text-xs font-semibold text-neutral-500 mb-1">DA</div>
              <h4 className="font-semibold text-neutral-900">Data & analytics</h4>
              <p className="text-sm text-neutral-600">From instrumentation to insight, minus the spin.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-neutral-200/70 bg-white shadow-sm p-6">
          <h3 className="text-xl font-bold text-neutral-900">Apps</h3>
          <p className="text-neutral-600">Find policies and platform specifics for each app.</p>
          <Link href="/apps" className="mt-3 inline-flex items-center text-red-700 hover:underline">Browse apps →</Link>
        </div>
      </section>
    </main>
  );
}
