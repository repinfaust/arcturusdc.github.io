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
            calendar to intelligently find achievable gaps for exercise, yoga, meditation, or
            downtime. It adapts to your energy levels and life patterns, helping you stay consistent
            without pressure or guilt. SyncFit makes self-care feel possible — and sustainable.
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
              How smart scheduling, gentle feedback, and flexible choices keep you consistent —
              no pressure.
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
                desc="Finds real, achievable gaps in your calendar for self-care."
                icon="timer"
              />
              <Feature
                title="Flexible Choices"
                desc="Accept, skip, or reschedule with a tap — you’re in control."
                icon="bolt"
              />
              <Feature
                title="Google Calendar Integration"
                desc="Connects seamlessly to surface times that genuinely work."
                icon="calendar"
              />
              <Feature
                title="Conflict-Free Tracking"
                desc="Mirrors sessions, detects clashes, and clearly marks conflicts."
                icon="check"
              />
              <Feature
                title="Sync Feedback"
                desc="Gentle nudges and clarity on what’s planned vs. done."
                icon="star"
              />
              <Feature
                title="Consistency, Not Pressure"
                desc="No streaks or guilt — progress over perfection."
                icon="shield"
              />
              <Feature
                title="Adaptable & Learning"
                desc="Improves suggestions as it learns your patterns and energy."
                icon="brain"
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
                    No. SyncFit doesn’t push generic plans or demand daily streaks. It works with
                    your real schedule, helping you find time for what matters.
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
                    No. Fitness is core, but SyncFit also makes space for yoga, meditation,
                    stretching, or even simple downtime.
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
                    No problem. SyncFit mirrors events in Firestore, detects conflicts, and simply
                    marks them — you stay in control, no messy auto-reschedules.
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
                    Yes. SyncFit only mirrors events it creates and doesn’t store your personal
                    calendar data beyond what’s needed to keep things synced.
                  </p>
                </AccordionItem>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Policies section (optional, keep/remove as needed) */}
      <section className="card p-6 mt-4">
        <h2 className="text-2xl font-extrabold mb-4">Policies</h2>
        <p className="text-sm text-neutral-700">
          App policies and terms will appear here.
        </p>
      </section>
    </main>
  );
}

/* --- Feature component --- */
function Feature({ title, desc, icon = 'dot' }) {
  const icons = {
    timer: (
      <svg width="20" height="20" fill="currentColor" aria-hidden="true">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M10 5v5l3 3" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    ),
    bolt: (
      <svg width="20" height="20" fill="currentColor" aria-hidden="true">
        <path d="M11 1L3 10h5l-1 9 8-11h-5z" />
      </svg>
    ),
    calendar: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <rect x="3" y="4" width="14" height="13" rx="2" />
        <path d="M6 2v4M14 2v4M3 8h14" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    ),
    check: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M7.5
