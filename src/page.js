import Link from "next/link";
import ScrollHero from "@/components/ScrollHero";

export default function Page(){
  return (
    <main className="pb-10 pt-[72px] relative">
      {/* Top intro/strapline (unchanged) */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white border border-neutral-200/70 p-8 shadow-sm">
            <p className="text-xs font-semibold text-red-600 mb-3">Product & Apps</p>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-900">
              Software that ships.
            </h1>
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
      </section>

      {/* Full-bleed hero (scrolls into view) */}
      <ScrollHero />

      {/* Capabilities — bigger + overlapping the hero */}
      <section
        id="capabilities"
        className={[
          "relative z-20 mx-auto max-w-[1200px] px-4",
          "-mt-16 md:-mt-20 lg:-mt-24", // pull up over hero
        ].join(" ")}
      >
        <div className="rounded-3xl border border-neutral-200/70 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-xl p-6 sm:p-8 lg:p-12">
          <h3 className="text-3xl sm:text-4xl lg:text-[40px] leading-tight font-extrabold text-neutral-900 mb-6 lg:mb-8">
            Capabilities
          </h3>

          <div className="grid gap-6 md:grid-cols-3 text-neutral-700">
            <div>
              <div className="text-xs font-semibold text-neutral-500 mb-1">PS</div>
              <h4 className="font-semibold text-neutral-900 text-lg">Product strategy</h4>
              <p className="text-sm text-neutral-600">Find and ship the next most valuable thing.</p>
              <Link href="/product-strategy" className="mt-3 inline-block text-sm text-red-700 hover:underline">
                Learn more
              </Link>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border px-2 py-1">Discovery</span>
                <span className="rounded-full border px-2 py-1">Compliance support</span>
                <span className="rounded-full border px-2 py-1">Delivery ops</span>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-neutral-500 mb-1">AD</div>
              <h4 className="font-semibold text-neutral-900 text-lg">App development</h4>
              <p className="text-sm text-neutral-600">Android & iOS with privacy-first design.</p>
            </div>

            <div>
              <div className="text-xs font-semibold text-neutral-500 mb-1">DA</div>
              <h4 className="font-semibold text-neutral-900 text-lg">Data & analytics</h4>
              <p className="text-sm text-neutral-600">From instrumentation to insight, minus the spin.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Apps teaser (unchanged) */}
      <section className="mx-auto max-w-6xl px-4 mt-8">
        <div className="rounded-2xl border border-neutral-200/70 bg-white shadow-sm p-6">
          <h3 className="text-xl font-bold text-neutral-900">Apps</h3>
          <p className="text-neutral-600">Find policies and platform specifics for each app.</p>
          <Link href="/apps" className="mt-3 inline-flex items-center text-red-700 hover:underline">Browse apps →</Link>
        </div>
      </section>
    </main>
  );
}
