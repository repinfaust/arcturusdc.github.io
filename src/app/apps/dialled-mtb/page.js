import Link from 'next/link';

export const metadata = {
  title: 'Dialled MTB — Arcturus Digital Consulting',
  description: 'Dialled MTB landing page.',
};

export default function DialledMtbPage() {
  return (
    <main className="pb-10">
      <div className="card p-4 flex items-start gap-3 mt-2">
        <div className="w-16 h-16 rounded-2xl border border-black/10 bg-[#1A1C1E] grid place-items-center">
          <DialledMark size={36} />
        </div>
        <div>
          <div className="font-extrabold text-xl tracking-tight text-[#1A1C1E]">Dialled MTB</div>
          <div className="text-muted text-sm">Set up right. Every ride.</div>
          <p className="mt-2 text-sm text-neutral-700">
            Dialled MTB is a maintenance and setup companion for mountain bikers. It combines
            passive ride sync, structured service tracking, practical setup guidance, and an
            AI advisor designed for real trail use.
          </p>
        </div>
      </div>

      <section className="relative mt-3 overflow-hidden rounded-2xl border border-black/10 bg-[#1A1C1E] text-[#E8ECF0]">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_#E8FF47_0%,_transparent_45%),radial-gradient(ellipse_at_bottom_left,_#2A2F34_0%,_transparent_55%)]" />
        <div className="relative p-6 md:p-10">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border border-[#2E3438] bg-[#22262A] px-4 py-2 mb-4">
                <DialledMark size={18} />
                <span className="text-xs font-bold tracking-[0.2em] text-[#E8FF47]">MOUNTAIN READY</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">DIALLED MTB</h1>
              <p className="mt-3 text-[#6A7680] text-lg md:text-2xl font-semibold">Set up right. Every ride.</p>
              <p className="mt-4 text-[#C7CDD3] max-w-[60ch]">
                v0.1 focuses on the core loop: maintenance tracking first, setup calculator and
                AI advisor as supporting features.
              </p>
            </div>

            <div className="rounded-2xl border border-[#2E3438] bg-[#22262A] p-4">
              <div className="aspect-video rounded-xl border border-dashed border-[#6A7680] bg-[#1A1C1E] grid place-items-center text-center px-6">
                <div>
                  <div className="text-[#E8FF47] font-bold tracking-[0.12em] text-xs">PLACEHOLDER</div>
                  <div className="mt-2 text-sm text-[#C7CDD3]">Demo video coming soon</div>
                  <div className="mt-1 text-xs text-[#6A7680]">Will be replaced with app walkthrough footage</div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Feature title="Maintenance Tracking" desc="27 service tasks across 6 categories with ride, hour, and calendar triggers." />
            <Feature title="Strava Integration" desc="Read-only OAuth sync to passively update ride counters and maintenance state." />
            <Feature title="Setup Calculator" desc="Suspension PSI, sag checks, and tyre pressure guidance from saved bike setup data." />
            <Feature title="AI Advisor" desc="Context-aware maintenance and setup guidance, powered by OpenAI." />
            <Feature title="Bike Catalogue" desc="Preloaded analogue and eMTB bike options, plus custom profile fallback." />
            <Feature title="Manual Ride Log" desc="Fallback logging when Strava is not connected." />
          </div>
        </div>
      </section>

      <section className="card p-6 mt-4">
        <h2 className="text-2xl font-extrabold mb-3">Build Scope (v0.1)</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm text-neutral-700">
          <li>iOS first release (Android follows after validation)</li>
          <li>Apple + Google sign-in via Firebase Auth</li>
          <li>No social features, no subscriptions, no push notifications in v0.1</li>
          <li>NFC and Garmin integrations are out of scope for this build</li>
        </ul>
      </section>

      <section className="card p-6 mt-4">
        <h2 className="text-2xl font-extrabold mb-4">Policies</h2>
        <ul className="space-y-2 text-sm">
          <li>
            <Link href="/apps/dialled-mtb/privacy-policy" className="text-blue-600 hover:underline">
              Privacy Policy (HTML)
            </Link>
          </li>
          <li>
            <Link href="/apps/dialled-mtb/terms-of-use" className="text-blue-600 hover:underline">
              Terms of Use (HTML)
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
}

function Feature({ title, desc }) {
  return (
    <div className="rounded-xl border border-[#2E3438] bg-[#22262A] p-4 text-[#E8ECF0]">
      <h3 className="font-bold text-[#E8FF47] tracking-wide text-sm">{title}</h3>
      <p className="mt-1 text-sm text-[#C7CDD3]">{desc}</p>
    </div>
  );
}

function DialledMark({ size = 60 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" aria-hidden="true">
      <polygon points="30,7 54,51 6,51" stroke="#E8ECF0" strokeWidth="2.2" fill="none" strokeLinejoin="round" />
      <polygon points="30,20 42,42 18,42" fill="#E8FF47" opacity="0.95" />
      <circle cx="30" cy="7" r="2.5" fill="#F2FF8A" />
    </svg>
  );
}
