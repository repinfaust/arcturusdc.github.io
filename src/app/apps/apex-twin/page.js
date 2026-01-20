import Link from 'next/link';
import Image from 'next/image';

export default function ApexTwin() {
  return (
    <main className="pb-10">
      {/* Top summary card */}
      <div className="card p-4 flex items-start gap-3 mt-2">
        <Image
          className="rounded-2xl border border-black/10"
          src="/img/apextwin-card-background.png"
          width={64}
          height={64}
          alt="ApexTwin logo"
          priority
        />
        <div>
          <div className="font-extrabold">ApexTwin</div>
          <div className="text-muted text-sm">Setup. Session. Progress.</div>
          <p className="mt-2 text-sm text-neutral-700">
            ApexTwin is a track-day setup companion for motorcyclists who want structure over guesswork.
            Whether you're logging tyre pressures between sessions or tracking suspension changes across a season,
            ApexTwin keeps everything in one place—so you can see what works, repeat what's fast, and ride with confidence.
            It's designed for everyday track riders through to aspiring racers who want clarity without complexity.
          </p>
        </div>
      </div>

      {/* HERO section with background + video */}
      <section className="relative mt-3 overflow-hidden rounded-2xl border border-black/10">
        {/* Background image */}
        <div className="absolute inset-0 -z-10">
          <Image
            src="/img/apextwin-card-background.png"
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
              Inside ApexTwin
            </h1>
            <p className="mt-3 text-white/85 max-w-2xl mx-auto">
              A modern setup journal for track-day riders—structured, fast, and built to help you improve.
            </p>
          </div>

          {/* Video showcase */}
          <div className="mt-6 md:mt-8">
            <div className="relative max-w-4xl mx-auto flex justify-center">
              <div className="rounded-xl border border-white/20 shadow-2xl overflow-hidden bg-black/50 backdrop-blur-sm">
                <video
                  className="w-full h-auto aspect-video"
                  src="/vid/apex twin demo 41s.mp4"
                  poster="/img/apextwin-card-background.png"
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                />
              </div>
              <div
                className="absolute -inset-2 -z-10 rounded-2xl blur-2xl opacity-40"
                style={{
                  background:
                    'radial-gradient(60% 60% at 50% 50%, rgba(255,255,255,0.25), rgba(0,0,0,0))',
                }}
              />
            </div>
          </div>

          {/* Key Features */}
          <div className="mt-10 md:mt-12">
            <h2 className="text-2xl md:text-[28px] font-extrabold text-white text-center md:text-left">
              Key Features
            </h2>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-white">
              <Feature
                title="Session Logging"
                desc="Log tyre pressures, compounds, gearing, and notes between sessions"
                icon="clipboard"
              />
              <Feature
                title="Bike Garage"
                desc="Manage multiple bikes with their own setup histories"
                icon="garage"
              />
              <Feature
                title="Track Strategy"
                desc="Annotate the circuit with braking points, lines, and coaching notes"
                icon="track"
              />
              <Feature
                title="Skill-Based UI"
                desc="Three modes unlock fields progressively"
                icon="levels"
              />
              <Feature
                title="Paddock View"
                desc="See what others are running at the same event"
                icon="users"
              />
              <Feature
                title="Event History"
                desc="Compare setups, spot patterns, track progression"
                icon="history"
              />
            </div>

            {/* FAQ accordion */}
            <div className="mt-10">
              <h2 className="text-2xl md:text-[28px] font-extrabold text-white text-center md:text-left">
                FAQ
              </h2>
              <div className="mt-5 space-y-3">
                <AccordionItem question="Who is ApexTwin for?">
                  <p>
                    ApexTwin is designed for everyday track riders through to aspiring racers.
                    Whether you're doing your first track day or competing regularly, ApexTwin helps
                    you build structure around your setup and progression.
                  </p>
                </AccordionItem>
                <AccordionItem question="What does 'Skill-Based UI' mean?">
                  <p>
                    The app has three modes that unlock fields progressively. Beginners see simplified
                    options to avoid overwhelm, while experienced riders and racers access detailed
                    suspension geometry, telemetry fields, and advanced setup tracking.
                  </p>
                </AccordionItem>
                <AccordionItem question="Can I track multiple bikes?">
                  <p>
                    Yes. The Bike Garage lets you manage multiple bikes, each with their own complete
                    setup history, making it easy to switch between machines or compare configurations.
                  </p>
                </AccordionItem>
                <AccordionItem question="What is Paddock View?">
                  <p>
                    Paddock View shows anonymized setup data from other riders at the same event.
                    It's a way to benchmark your setup and learn from the paddock community without
                    revealing personal information.
                  </p>
                </AccordionItem>
                <AccordionItem question="How does Track Strategy work?">
                  <p>
                    You can annotate circuit maps with braking points, racing lines, and coaching notes.
                    This visual reference helps you remember what worked and plan improvements for your
                    next session.
                  </p>
                </AccordionItem>
                <AccordionItem question="Is my data private?">
                  <p>
                    All your setup data is private by default. You control what's shared in Paddock View,
                    and even then it's anonymized. Your detailed notes, suspension settings, and historical
                    data remain completely private.
                  </p>
                </AccordionItem>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* --- Feature component --- */
function Feature({ title, desc, icon = 'dot' }) {
  const icons = {
    clipboard: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <rect x="5" y="2" width="10" height="16" rx="2" />
        <path d="M7 2h6v2H7z" />
        <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    garage: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M2 8l8-4 8 4v9H2V8z" />
        <rect x="7" y="11" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M10 14v3" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    track: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M3 10c0-4 3-7 7-7s7 3 7 7-3 7-7 7-7-3-7-7z" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M10 7v3l2 2" stroke="currentColor" strokeWidth="2" />
        <circle cx="10" cy="10" r="1.5" />
      </svg>
    ),
    levels: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <rect x="3" y="12" width="4" height="5" rx="1" />
        <rect x="8" y="8" width="4" height="9" rx="1" />
        <rect x="13" y="4" width="4" height="13" rx="1" />
      </svg>
    ),
    users: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <circle cx="8" cy="7" r="3" />
        <circle cx="14" cy="7" r="2.5" />
        <path d="M2 17c0-3 2.7-5 6-5s6 2 6 5" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M14 17c0-2 1.3-3.5 4-3.5" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    history: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M10 3c-3.9 0-7 3.1-7 7s3.1 7 7 7 7-3.1 7-7" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M10 6v4l3 3" stroke="currentColor" strokeWidth="2" />
        <path d="M17 3l-2 2 2 2" />
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

/* --- Accordion components --- */
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
