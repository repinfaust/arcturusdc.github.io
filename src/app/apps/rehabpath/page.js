import Link from 'next/link';
import Image from 'next/image';

export default function RehabPath() {
  return (
    <main className="pb-10">
      {/* Top summary card */}
      <div className="card p-4 flex items-start gap-3 mt-2">
        <Image
          className="rounded-2xl border border-black/10"
          src="/img/rehabpath-card-background.png"
          width={64}
          height={64}
          alt="RehabPath logo"
          priority
        />
        <div>
          <div className="font-extrabold">RehabPath</div>
          <div className="text-muted text-sm">Your guided path to recovery.</div>
          <p className="mt-2 text-sm text-neutral-700">
            RehabPath is a structured recovery companion for people working through injury rehab.
            It provides clear, phase-based programmes, step-by-step exercise guidance, and visible
            progress tracking—all stored privately on your device. No accounts, no tracking, no complexity.
            Just a calm, focused tool to help you stay on course and see your improvement.
          </p>
        </div>
      </div>

      {/* HERO section with background + video */}
      <section className="relative mt-3 overflow-hidden rounded-2xl border border-black/10">
        {/* Background image */}
        <div className="absolute inset-0 -z-10">
          <Image
            src="/img/rehabpath-card-background.png"
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
              Inside RehabPath
            </h1>
            <p className="mt-3 text-white/85 max-w-2xl mx-auto">
              Structured rehab programmes, simple exercise guidance, and private progress tracking—designed
              to support your recovery without the friction.
            </p>
          </div>

          {/* Video showcase */}
          <div className="mt-6 md:mt-8">
            <div className="relative max-w-4xl mx-auto flex justify-center">
              <div className="rounded-xl border border-white/20 shadow-2xl overflow-hidden bg-black/50 backdrop-blur-sm">
                <Image
                  src="/vid/Simulator Screen Recording - iPhone 16 - 2025-12-11 at 10.30.56.gif"
                  alt="RehabPath app demonstration"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                  unoptimized
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
                title="Structured Programmes"
                desc="Multi-phase recovery plans with daily exercises, clear progressions, and realistic timelines. Pick your injury, follow the path."
                icon="programme"
              />
              <Feature
                title="Exercise Guidance"
                desc="Each exercise includes form cues, reps, sets, and safety notes. Written for real people, not clinicians."
                icon="guidance"
              />
              <Feature
                title="Progress Tracking"
                desc="Mark exercises complete and watch your recovery take shape. Visual milestones show how far you've come."
                icon="progress"
              />
              <Feature
                title="Privacy-First"
                desc="No accounts. No cloud. No tracking. Your data stays on your device—nothing leaves."
                icon="privacy"
              />
              <Feature
                title="Nutrition Tips"
                desc="Programme-specific guidance on foods that support tissue repair, hydration, and recovery nutrition."
                icon="nutrition"
              />
              <Feature
                title="Phase-Based Recovery"
                desc="Work through Early Mobility, Stability & Control, and Load & Return at your own pace. Each phase builds on the last."
                icon="phases"
              />
            </div>

            {/* FAQ accordion */}
            <div className="mt-10">
              <h2 className="text-2xl md:text-[28px] font-extrabold text-white text-center md:text-left">
                FAQ
              </h2>
              <div className="mt-5 space-y-3">
                <AccordionItem question="Is RehabPath a replacement for physio?">
                  <p>
                    No. RehabPath is a support tool, not medical advice. Always consult your physio or GP
                    before starting any rehab programme. Use RehabPath to stay organised and track the exercises
                    they've recommended.
                  </p>
                </AccordionItem>
                <AccordionItem question="What injuries does RehabPath cover?">
                  <p>
                    RehabPath includes programmes for common injuries like ACL recovery, rotator cuff rehab,
                    ankle sprains, lower back pain, and more. Each programme is phase-based and includes
                    exercises with clear form guidance.
                  </p>
                </AccordionItem>
                <AccordionItem question="Where is my data stored?">
                  <p>
                    All your data stays on your device. RehabPath doesn't require an account, doesn't sync to
                    the cloud, and doesn't track your activity. Your recovery progress is completely private.
                  </p>
                </AccordionItem>
                <AccordionItem question="Can I customise the programmes?">
                  <p>
                    Yes. While RehabPath provides structured programmes, you can adjust reps, sets, and rest days
                    to match your physio's recommendations. You're in control of your recovery timeline.
                  </p>
                </AccordionItem>
                <AccordionItem question="What are the three recovery phases?">
                  <p>
                    Most programmes follow a three-phase structure: Early Mobility (reduce pain, restore range),
                    Stability & Control (build strength, improve form), and Load & Return (progressive loading,
                    return to activity). Each phase unlocks when you're ready.
                  </p>
                </AccordionItem>
                <AccordionItem question="Is there a cost?">
                  <p>
                    RehabPath offers a free tier with core programmes. Premium programmes and advanced tracking
                    features are available through a one-time purchase—no subscriptions.
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
    programme: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <rect x="3" y="3" width="14" height="14" rx="2" />
        <path d="M3 7h14" stroke="currentColor" strokeWidth="2" />
        <circle cx="7" cy="11" r="1" />
        <circle cx="7" cy="14" r="1" />
        <path d="M10 11h5M10 14h3" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    guidance: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M10 3c-4 0-7 3-7 7s3 7 7 7 7-3 7-7-3-7-7-7z" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M10 7v3l2 2" stroke="currentColor" strokeWidth="2" />
        <path d="M9.5 5.5h1M5.5 9.5v1M14.5 9.5v1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    progress: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M3 10l4 4 10-10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="7" cy="14" r="1.5" />
        <circle cx="17" cy="4" r="1.5" />
      </svg>
    ),
    privacy: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <rect x="5" y="9" width="10" height="8" rx="1" />
        <path d="M7 9V6a3 3 0 016 0v3" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="10" cy="13" r="1" />
      </svg>
    ),
    nutrition: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M10 3c-1 0-2 1-2 2v3c0 2 1 3 2 3s2-1 2-3V5c0-1-1-2-2-2z" />
        <path d="M10 11v6" stroke="currentColor" strokeWidth="2" />
        <circle cx="10" cy="17" r="1" />
        <path d="M6 5c-1 0-2 1-2 3v1c0 1 1 2 2 2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    phases: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <circle cx="5" cy="10" r="2" />
        <circle cx="10" cy="10" r="2" />
        <circle cx="15" cy="10" r="2" />
        <path d="M7 10h1M12 10h1" stroke="currentColor" strokeWidth="2" />
        <path d="M3 10l10-6M7 10l10 6" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
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
