import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Dialled MTB — Arcturus Digital Consulting',
  description: 'The complete tool kit for mountain bikers who take their riding seriously.',
};

export default function DialledMtb() {
  return (
    <main className="pb-10">
      <div className="card p-4 flex items-start gap-3 mt-2">
        <div className="rounded-2xl border border-black/10 bg-[#121214] p-2 flex items-center justify-center" style={{ width: 64, height: 64 }}>
          <Image
            src="/img/dialled-mtb-logo.svg"
            width={48}
            height={48}
            alt="Dialled MTB logo"
            priority
          />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#121214]">DIALLED MTB</h1>
          <div className="text-muted text-sm">Keep your bike dialled. Know when to service it. Set it up right.</div>
          <p className="mt-2 text-sm text-neutral-700">
            Dialled MTB is the complete tool kit for mountain bikers who take their riding seriously —
            whether you're running a trail hardtail or a full-power e-MTB.
          </p>
        </div>
      </div>

      <section className="relative mt-3 overflow-hidden rounded-2xl border border-black/10">
        <div className="absolute inset-0 -z-10">
          <Image src="/img/dialled-mtb-card-background.svg" alt="" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-[#121214]/60" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#E8196E]/10 via-transparent to-[#121214]/40" />
        </div>

        <div className="p-6 md:p-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
              Inside Dialled MTB
            </h2>
            <p className="mt-3 text-[#C8C8D8] max-w-2xl mx-auto">
              Built for trail riders, enduro racers, and everyone in between.
            </p>
          </div>

          <div className="mt-6 md:mt-8">
            <div className="relative max-w-4xl mx-auto flex justify-center">
              <div
                className="w-full aspect-video rounded-xl border overflow-hidden flex flex-col items-center justify-center gap-4"
                style={{ borderColor: '#4A1A2D', background: 'linear-gradient(180deg, rgba(232,25,110,0.12), rgba(18,18,20,0.92))' }}
              >
                <DialledMark size={56} />
                <div className="text-center">
                  <p className="text-xs font-black uppercase tracking-[0.24em]" style={{ color: '#E8196E' }}>
                    Coming Soon
                  </p>
                  <p className="mt-2 text-base font-semibold text-white">Product walkthrough video in production</p>
                </div>
              </div>
              <div
                className="absolute -inset-2 -z-10 rounded-2xl blur-2xl opacity-40"
                style={{
                  background:
                    'radial-gradient(60% 60% at 50% 50%, rgba(232,25,110,0.35), rgba(0,0,0,0))',
                }}
              />
            </div>
          </div>

          <div className="mt-10 md:mt-12">
            <h2 className="text-2xl md:text-[28px] font-extrabold text-white text-center md:text-left">
              Key Features
            </h2>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-white">
              <Feature
                title="Maintenance Tracking"
                desc="Stop guessing when your fork was last serviced. Dialled tracks your maintenance across every component — drivetrain, suspension, brakes, bearings, and more — triggered by ride count, hours, or calendar intervals. Get reminders before things go wrong, not after."
                icon="wrench"
              />
              <Feature
                title="Setup Calculators"
                desc="Get your suspension and tyres dialled in minutes, not hours. Enter your weight and riding style and Dialled gives you a personalised starting point for fork and shock PSI, with a sag checker to validate with real measurements."
                icon="sliders"
              />
              <Feature
                title="Bike Catalogue"
                desc="Supports a wide range of analogue and electric mountain bikes. Set up multiple profiles and save your setup and service history against each one."
                icon="bikes"
              />
              <Feature
                title="AI Advisor"
                desc="Not sure what that creak means? Ask the AI Advisor. Get quick, context-aware guidance on setup, service priorities, and bike-specific questions."
                icon="ai"
              />
              <Feature
                title="Strava Connected"
                desc="Link your Strava account and Dialled uses your actual ride data to trigger maintenance intervals automatically. No manual logging required."
                icon="sync"
              />
              <Feature
                title="Free + Premium"
                desc="Free covers one bike, setup tools, Strava sync, and partner offers. Premium unlocks unlimited bikes and the full maintenance tracker."
                icon="tiers"
              />
            </div>

            <div className="mt-10">
              <h2 className="text-2xl md:text-[28px] font-extrabold text-white text-center md:text-left">
                FAQ
              </h2>
              <div className="mt-5 space-y-3">
                <AccordionItem question="Who is Dialled MTB for?">
                  <p>
                    Dialled MTB is for mountain bikers who want to keep their bike properly maintained
                    and set up correctly — from casual trail riders to enduro racers tracking multiple
                    bikes across analogue and e-MTB platforms.
                  </p>
                </AccordionItem>
                <AccordionItem question="What components does the Maintenance Tracker cover?">
                  <p>
                    Drivetrain, suspension, brakes, bearings, and more. You set intervals by ride count,
                    hours, or calendar — Dialled reminds you before things go wrong, not after.
                  </p>
                </AccordionItem>
                <AccordionItem question="How do the setup calculators work?">
                  <p>
                    Enter your weight and riding style to get a personalised starting point for fork and
                    shock PSI. Choose terrain and tyre width for front and rear pressure recommendations
                    that match how and where you ride. Run the sag checker to validate with real measurements.
                  </p>
                </AccordionItem>
                <AccordionItem question="How does Strava sync work?">
                  <p>
                    With read-only Strava access, your actual ride data triggers maintenance intervals
                    automatically. No manual logging. Dialled never writes to your Strava account.
                  </p>
                </AccordionItem>
                <AccordionItem question="What's the difference between Free and Premium?">
                  <p>
                    Free gives you one bike, setup calculators, Strava sync, and partner offers.
                    Premium unlocks unlimited bikes and the full maintenance tracker with all interval
                    and history features, plus the AI Advisor.
                  </p>
                </AccordionItem>
                <AccordionItem question="Is it available on Android and iOS?">
                  <p>
                    Yes. Dialled MTB is being built for both Android and iOS.
                  </p>
                </AccordionItem>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="card p-6 mt-4">
        <h2 className="text-2xl font-extrabold mb-4">Policies</h2>
        <ul className="space-y-2 text-sm">
          <li>
            <Link href="/apps/dialled-mtb/privacy-policy" className="text-[#E8196E] hover:underline">
              Privacy Policy
            </Link>
          </li>
          <li>
            <Link href="/apps/dialled-mtb/terms-of-use" className="text-[#E8196E] hover:underline">
              Terms of Use
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
}

function Feature({ title, desc, icon = 'dot' }) {
  const icons = {
    wrench: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" viewBox="0 0 24 24">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
    sliders: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" viewBox="0 0 20 20">
        <line x1="4" y1="6" x2="16" y2="6" />
        <line x1="4" y1="12" x2="16" y2="12" />
        <line x1="4" y1="18" x2="16" y2="18" />
        <circle cx="8" cy="6" r="2" fill="currentColor" stroke="none" />
        <circle cx="13" cy="12" r="2" fill="currentColor" stroke="none" />
        <circle cx="7" cy="18" r="2" fill="currentColor" stroke="none" />
      </svg>
    ),
    bikes: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="5.5" cy="17.5" r="3.5" />
        <circle cx="18.5" cy="17.5" r="3.5" />
        <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5L9 3" />
        <path d="M6 17.5l3-9 2.5 4.5H18" />
      </svg>
    ),
    ai: (
      <svg width="20" height="20" fill="currentColor" aria-hidden="true" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="3" />
        <path d="M10 1v3M10 16v3M1 10h3M16 10h3M3.5 3.5l2.1 2.1M14.4 14.4l2.1 2.1M3.5 16.5l2.1-2.1M14.4 5.6l2.1-2.1" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    ),
    sync: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" viewBox="0 0 24 24">
        <polyline points="1 4 1 10 7 10" />
        <polyline points="23 20 23 14 17 14" />
        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
      </svg>
    ),
    tiers: (
      <svg width="20" height="20" fill="currentColor" aria-hidden="true" viewBox="0 0 20 20">
        <rect x="2" y="13" width="4" height="5" rx="1" />
        <rect x="8" y="9" width="4" height="9" rx="1" />
        <rect x="14" y="5" width="4" height="13" rx="1" />
      </svg>
    ),
    dot: (
      <svg width="20" height="20" fill="currentColor" aria-hidden="true" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="3" />
      </svg>
    ),
  };

  return (
    <div className="flex items-start gap-3">
      <span className="shrink-0 mt-1 grid place-items-center rounded-lg border p-2 shadow-sm" style={{ borderColor: '#4A1A2D', background: 'rgba(232,25,110,0.12)', color: '#E8196E' }}>
        {icons[icon]}
      </span>
      <div>
        <h4 className="font-semibold text-white">{title}</h4>
        <p className="text-[#C8C8D8] text-sm">{desc}</p>
      </div>
    </div>
  );
}

function AccordionItem({ question, children }) {
  return (
    <details className="group rounded-2xl border text-white open:bg-[#1E1E22] transition" style={{ borderColor: '#2E2E36', background: '#1E1E22' }}>
      <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 list-none">
        <span className="text-base font-semibold select-none">{question}</span>
        <Chevron />
      </summary>
      <div className="px-4 pb-4 pt-0 text-[#C8C8D8] text-sm leading-relaxed">{children}</div>
    </details>
  );
}

function Chevron() {
  return (
    <span className="inline-block transition-transform group-open:rotate-180" aria-hidden>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path d="M5.5 7.5L10 12l4.5-4.5" />
      </svg>
    </span>
  );
}

function DialledMark({ size = 60 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" aria-hidden="true">
      <polygon points="30,7 54,51 6,51" stroke="#E8ECF0" strokeWidth="2.2" fill="none" strokeLinejoin="round" />
      <polygon points="30,20 42,42 18,42" fill="#E8196E" opacity="0.95" />
      <circle cx="30" cy="7" r="2.5" fill="#E8ECF0" />
    </svg>
  );
}
