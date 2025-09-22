import Link from 'next/link';
import Image from 'next/image';

export default function SyncFit() {
  return (
    <main className="pb-10">
      {/* Top summary card */}
      <div className="card p-4 flex items-start gap-3 mt-2">
        <Image
          className="rounded-2xl border border-black/10"
          src="/img/SyncFit_App_Icon_512x512.png"
          width={64}
          height={64}
          alt="SyncFit logo"
          priority
        />
        <div>
          <div className="font-extrabold">SyncFit</div>
          <div className="text-muted text-sm">
            Find time for you — fitness, mindfulness, and self-care that fit your life.
          </div>
          <p className="mt-2 text-sm text-neutral-700">
            SyncFit is a smart fitness app built for real lives — busy, messy, and unpredictable.
            Instead of rigid workout schedules or endless notifications, SyncFit connects with your
            calendar to intelligently find achievable gaps for exercise, yoga, meditation, or downtime.
            It adapts to your energy levels and life patterns, helping you stay consistent without
            pressure or guilt. SyncFit makes self-care feel possible — and sustainable.
          </p>
        </div>
      </div>

      {/* HERO section with background (no video yet) */}
      <section className="relative mt-3 overflow-hidden rounded-2xl border border-black/10">
        {/* Background image */}
        <div className="absolute inset-0 -z-10">
          <Image
            src="/img/syncfit-card-background.png"
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/40 mix-blend-multiply" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
        </div>

        <div className="p-6 md:p-10">
          {/* Title + intro */}
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
              Inside SyncFit
            </h1>
            <p className="mt-3 text-white/85 max-w-2xl mx-auto">
              A quick look at how smart scheduling helps you make space for what matters.
            </p>
          </div>

          {/* Key Features */}
          <div className="mt-10 md:mt-12">
            <h2 className="text-2xl md:text-[28px] font-extrabold text-white text-center md:text-left">
              Key Features
            </h2>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-white">
              <Feature
                title="Smart Scheduling"
                desc="Find real gaps in your calendar for fitness or self-care."
                icon="calendar"
              />
              <Feature
                title="Flexible Choices"
                desc="Accept, skip, or reschedule suggestions with a tap."
                icon="bolt"
              />
              <Feature
                title="Google Calendar Integration"
                desc="Seamlessly connects with your existing calendar."
                icon="device"
              />
              <Feature
                title="Conflict-Free Tracking"
                desc="Spots clashes automatically, so you stay in control."
                icon="shield"
              />
              <Feature
                title="Sync Feedback"
                desc="Mirrors sessions to keep everything aligned."
                icon="chart"
              />
              <Feature
                title="Consistency, Not Pressure"
                desc="Focus on sustainable progress, not streaks."
                icon="star"
              />
              <Feature
                title="Adaptable & Learning"
                desc="Adapts to your energy levels and evolving routine."
                icon="smile"
              />
            </div>

            {/* FAQ accordion */}
            <div className="mt-10">
              <h2 className="text-2xl md:text-[28px] font-extrabold text-white text-center md:text-left">
                FAQ
              </h2>
              <div className="mt-5 space-y-3">
                <AccordionItem question="Is SyncFit just another workout app?">
                  <p>
                    No. SyncFit doesn’t push generic plans or demand daily streaks. It works with your
                    real schedule, helping you find time for what matters.
                  </p>
                </AccordionItem>

                <AccordionItem question="Do I have to follow a strict plan?">
                  <p>
                    Not at all. SyncFit is flexible — you can accept, skip, or reschedule suggested
                    sessions with a tap.
                  </p>
                </AccordionItem>

                <AccordionItem question="Does it only support workouts?">
                  <p>
                    No. Fitness is core, but SyncFit also makes space for yoga, meditation, stretching,
                    or even simple downtime.
                  </p>
                </AccordionItem>

                <AccordionItem question="Do I have to use it every day?">
                  <p>
                    No pressure. SyncFit adapts to your life. Use it when you want — it’s about
                    consistency over time, not daily obligation.
                  </p>
                </AccordionItem>

                <AccordionItem question="What calendars does it work with?">
                  <p>
                    Google Calendar is supported now. iCal and Outlook are on the roadmap.
                  </p>
                </AccordionItem>

                <AccordionItem question="What if my plans change?">
                  <p>
                    No problem. SyncFit mirrors sessions, detects conflicts, and simply marks them —
                    you stay in control, no messy auto-reschedules.
                  </p>
                </AccordionItem>

                <AccordionItem question="Who is SyncFit for?">
                  <p>
                    Anyone who struggles to find time for themselves. Busy professionals, parents,
                    students — anyone who wants consistency without rigidity.
                  </p>
                </AccordionItem>

                <AccordionItem question="Is my data private?">
                  <p>
                    Yes. SyncFit only mirrors sessions it creates and doesn’t store your personal
                    calendar data beyond what’s needed to keep things synced.
                  </p>
                </AccordionItem>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Policies section */}
      <section className="card p-6 mt-4">
        <h2 className="text-2xl font-extrabold mb-4">Policies</h2>
        <ul className="list-disc ml-5 mt-2 space-y-1 text-red-600">
          <li>
            <Link href="/privacy">Privacy Policy</Link> (generic)
          </li>
          <li>
            <Link href="/terms">Terms of Use</Link> (generic)
          </li>
        </ul>
      </section>
    </main>
  );
}

/* --- Feature component --- */
function Feature({ title, desc, icon = 'dot' }) {
  const icons = {
    calendar: (
      <svg width="20" height="20" fill="currentColor" aria-hidden="true">
        <rect x="3" y="4" width="14" height="13" rx="2" />
        <path d="M3 8h14" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    bolt: (
      <svg width="20" height="20" fill="currentColor" aria-hidden="true">
        <path d="M11 1L3 10h5l-1 9 8-11h-5z" />
      </svg>
    ),
    star: (
      <svg width="20" height="20" fill="currentColor" aria-hidden="true">
        <path d="M10 1l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
      </svg>
    ),
    chart: (
      <svg width="20" height="20" fill="currentColor" aria-hidden="true">
        <path d="M4 12h2v6H4zm5-4h2v10H9zm5-6h2v16h-2z" />
      </svg>
    ),
    shield: (
      <svg width="20" height="20" fill="currentColor" aria-hidden="true">
        <path d="M10 1l9 4v6c0 5-3.5 9-9 11-5.5-2-9-6-9-11V5z" />
      </svg>
    ),
    device: (
      <svg width="20" height="20" fill="currentColor" aria-hidden="true">
        <rect x="6" y="2" width="8" height="16" rx="2" />
      </svg>
    ),
    smile: (
      <svg width="20" height="20" fill="currentColor" aria-hidden="true">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M6 8h.01M14 8h.01M7 13a5 5 0 0 0 6 0" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    dot: (
      <svg width="20" height="20" fill="currentColor" aria-hidden="true">
        <circle cx="10" cy="10" r="3" />
      </svg>
    ),
  };

  return (
    <div className="flex items-start gap-3">
      <span className="shrink-0 mt-1 grid place-items-center rounded-lg border border-white/20 bg-white/10 p-2 shadow-sm text-white">
        {icons[icon]}
      </span>
      <div>
        <h4 className="font-semibold text-white">{title}</h4>
        <p className="text-white/80 text-sm">{desc}</p>
      </div>
    </div>
  );
}

/* --- Accordion components (native <details> for accessibility) --- */
function AccordionItem({ question, children }) {
  return (
    <details className="group rounded-2xl border border-white/15 bg-white/5 text-white open:bg-white/10 transition">
      <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 list-none">
        <span className="text-base font-semibold select-none">{question}</span>
        <Chevron />
      </summary>
      <div className="px-4 pb-4 pt-0 text-white/90 text-sm leading-relaxed">
        {children}
      </div>
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
