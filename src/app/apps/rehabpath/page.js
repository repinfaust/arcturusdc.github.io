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
          <div className="text-muted text-sm">Your recovery plan, organised.</div>
          <p className="mt-2 text-sm text-neutral-700">
            RehabPath helps you keep your rehabilitation plan, daily activity, symptoms, notes, and
            progress in one calm place. It is built for people following guidance from a physio,
            clinician, or therapist, with privacy-first local storage and optional reviewed AI tools
            for importing a plan or preparing a clinician summary.
          </p>
          <p className="mt-2 text-sm text-neutral-700">
            No RehabPath account. No cloud sync. No analytics. Your recovery records stay on your
            device by default, and optional AI features only send reviewed, redacted content when
            you choose to use them.
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
              Follow your own rehab plan, log how recovery is going, and create clear progress
              packs for appointments.
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
                title="Custom Plans"
                desc="Create your own rehab plan manually or import a selectable-text PDF from your clinician. RehabPath reads the PDF text on your device, redacts detected personal details, and shows you exactly what will be sent before AI structures it into a plan."
                icon="programme"
              />
              <Feature
                title="Daily Recovery View"
                desc="See today's exercises and activities in one place. Mark items complete, skip difficult days with context, and keep your routine visible without streak pressure."
                icon="guidance"
              />
              <Feature
                title="Symptom & Activity Logging"
                desc="Record activity, pain, stiffness, fatigue, mood, sleep, confidence, and notes over time. Keep the day-to-day detail that is easy to forget between appointments."
                icon="progress"
              />
              <Feature
                title="Progress Overview"
                desc="Review recent activity, symptom trends, milestone status, and recovery patterns in a simple timeline-style view."
                icon="phases"
              />
              <Feature
                title="Clinician Progress Pack"
                desc="Export a patient-generated PDF summary for your physio or clinician. Choose the date range and sections to include, such as activity summary, symptom trends, milestones, notes, and activity log."
                icon="guidance"
              />
              <Feature
                title="Optional AI Summary"
                desc="Generate a plain-English summary for your clinician pack from structured app metrics. Your written notes are not sent to the AI summary feature, and you review and edit the summary before it is included."
                icon="programme"
              />
              <Feature
                title="Encrypted Backup"
                desc="Create an encrypted backup file when you choose. RehabPath does not receive the backup file and cannot recover your passphrase if it is lost."
                icon="privacy"
              />
              <Feature
                title="Privacy-First"
                desc="RehabPath stores your recovery data locally by default. There are no RehabPath accounts, no cloud sync, no analytics, and no advertising trackers. Optional AI features require an internet connection and send only reviewed, redacted content for the selected task."
                icon="privacy"
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
                    No. RehabPath is a self-guided logging and organisation tool. It does not
                    provide medical advice, diagnosis, treatment recommendations, clinical decision
                    support, or emergency help. Always follow the guidance of your clinician or
                    therapist.
                  </p>
                </AccordionItem>
                <AccordionItem question="Can I use my own plan?">
                  <p>
                    Yes. RehabPath is currently focused on custom plans. You can enter your plan
                    manually or import a selectable-text PDF and review the structured result before
                    saving it.
                  </p>
                </AccordionItem>
                <AccordionItem question="Does PDF import work with scans or photos?">
                  <p>
                    Not yet. The current import feature supports PDFs with selectable text. Scanned
                    documents, photos, and handwritten-note OCR are not supported in this release.
                  </p>
                </AccordionItem>
                <AccordionItem question="Where is my data stored?">
                  <p>
                    Your app data is stored locally on your device by default. Optional encrypted
                    backups and clinician pack PDFs are exported only when you choose. Optional AI
                    features send limited, reviewed, redacted content through RehabPath's AI gateway
                    and OpenAI for the selected task.
                  </p>
                </AccordionItem>
                <AccordionItem question="Does RehabPath send my notes to AI?">
                  <p>
                    For plan import, you review the redacted PDF text before it is sent for
                    structuring. For AI clinician summaries, written notes are not sent to the AI
                    summary feature; the summary is generated from structured metrics such as
                    activity counts, symptom scores, and milestones.
                  </p>
                </AccordionItem>
                <AccordionItem question="Is there a cost?">
                  <p>
                    For the current trial build, custom plan use is free. Paid programme paths are
                    not part of this launch experience.
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
            <Link href="/apps/rehabpath/privacy-policy" className="text-blue-600 hover:underline">
              Privacy Policy (HTML)
            </Link>
          </li>
          <li>
            <Link href="/apps/rehabpath/terms-of-use" className="text-blue-600 hover:underline">
              Terms of Use (HTML)
            </Link>
          </li>
          <li>
            <Link href="/apps/rehabpath/delete-account" className="text-blue-600 hover:underline">
              Delete account or data
            </Link>
          </li>
        </ul>
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
