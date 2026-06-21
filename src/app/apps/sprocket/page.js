import Link from 'next/link';
import Image from 'next/image';

const SPROCKET_APP_STORE_US =
  'https://apps.apple.com/us/app/sprocket-calm-phone-helper/id6759454436';

export default function Sprocket() {
  return (
    <main className="pb-10">
      <div className="card p-4 flex items-start gap-3 mt-2">
        <Image
          className="rounded-2xl border border-black/10 bg-white"
          src="/img/sprocket-logo.png"
          width={64}
          height={64}
          alt="Sprocket logo"
          priority
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Image
              src="/img/sprocket-wordmark.png"
              width={170}
              height={48}
              alt="Sprocket wordmark"
              priority
            />
          </div>
          <div className="text-muted text-sm">
            Calm phone help for reminders, memory, tech tasks, and confusing messages.
          </div>
          <p className="mt-2 text-sm text-neutral-700">
            Sprocket gives patient, plain-language support by voice or text: set reminders,
            remember details, follow phone tasks one step at a time, and understand letters,
            emails, or texts without technical language.
          </p>

          <div className="mt-5 flex flex-col items-stretch gap-2 border-t border-[#E0E4DB]/80 pt-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#4B5B54]">
              Available on iPhone
            </p>
            <div className="flex justify-center sm:justify-end">
              <AppStoreBadgeLink prominent priority />
            </div>
          </div>
        </div>
      </div>

      <section className="relative mt-3 overflow-hidden rounded-2xl border border-black/10">
        <div className="absolute inset-0 -z-10">
          <Image src="/img/sprocket-hero-bg.svg" alt="" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-[#F2F4EF]/20" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-[#1B5E4B]/25" />
        </div>

        <div className="p-6 md:p-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-extrabold text-[#1A2420] tracking-tight">
              Inside Sprocket
            </h1>
            <p className="mt-3 text-[#4B5B54] max-w-2xl mx-auto">
              Plain-language support for everyday phone help, reminders, saved details,
              confusing messages, and answers you can read or hear.
            </p>
          </div>

          <div className="mt-6 md:mt-8">
            <div className="relative max-w-4xl mx-auto flex justify-center">
              <div className="rounded-xl border border-black/10 shadow-2xl overflow-hidden bg-white/60 backdrop-blur-sm">
                <video
                  className="w-full h-auto aspect-video"
                  src="/vid/sprocket%20for%20web.mp4"
                  poster="/img/sprocket-logo.png"
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                />
              </div>
              <div
                className="absolute -inset-2 -z-10 rounded-2xl blur-2xl opacity-50"
                style={{
                  background:
                    'radial-gradient(60% 60% at 50% 50%, rgba(39,138,108,0.35), rgba(0,0,0,0))',
                }}
              />
            </div>
          </div>

          <div className="mt-10 md:mt-12">
            <h2 className="text-2xl md:text-[28px] font-extrabold text-[#1A2420] text-center md:text-left">
              Key Features
            </h2>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-[#1A2420]">
              <Feature
                title="Voice and Text Assistant"
                desc="Speak or type everyday questions and get calm, short replies without navigating complex menus."
                icon="mic"
              />
              <Feature
                title="Plain-Language Reminders"
                desc="Set, move, and cancel reminders in normal language, then see them in a simple list."
                icon="bell"
              />
              <Feature
                title="Memory and Notes"
                desc="Save useful names, places, and details privately, with corrections handled as updates."
                icon="note"
              />
              <Feature
                title="Step-by-Step Phone Help"
                desc="Get guided help for tasks like Wi-Fi, bigger text, updates, photos, and other phone basics."
                icon="steps"
              />
              <Feature
                title="Confusing Message Explainers"
                desc="Turn difficult letters, emails, or texts into plain meaning, likely urgency, and a clear next step."
                icon="untangle"
              />
              <Feature
                title="Read-Aloud and Privacy Controls"
                desc="Hear replies aloud, use the app without an account, and keep notes and reminders on your phone by default."
                icon="lock"
              />
            </div>

            <div className="mt-10">
              <h2 className="text-2xl md:text-[28px] font-extrabold text-[#1A2420] text-center md:text-left">
                FAQ
              </h2>
              <div className="mt-5 space-y-3">
                <AccordionItem question="Who is Sprocket for?">
                  <p>
                    Sprocket is for anyone who wants a patient phone helper for everyday tasks,
                    especially users who prefer clear, plain-language support by voice or text.
                  </p>
                </AccordionItem>
                <AccordionItem question="What can Sprocket help with?">
                  <p>
                    It can help with reminders, saved details, step-by-step phone tasks, confusing
                    messages, read-aloud replies, and everyday questions.
                  </p>
                </AccordionItem>
                <AccordionItem question="What do the message explainers do?">
                  <p>
                    It explains what a message means, whether action is needed, and what to do next,
                    then can suggest a draft reply you control.
                  </p>
                </AccordionItem>
                <AccordionItem question="Can Sprocket send messages for me?">
                  <p>
                    No. Sprocket can help draft text, but you review and send anything yourself.
                  </p>
                </AccordionItem>
                <AccordionItem question="Does it give legal or financial advice?">
                  <p>
                    No. It provides plain-language guidance and next-step suggestions, not legal or
                    financial advice.
                  </p>
                </AccordionItem>
                <AccordionItem question="Is my data private?">
                  <p>
                    Sprocket stores notes and reminders on your phone by default, and warns before
                    sending likely sensitive content for AI processing.
                  </p>
                </AccordionItem>
                <AccordionItem question="Do I have to use voice?">
                  <p>
                    No. Voice and text are both first-class options, and you can switch between them anytime.
                  </p>
                </AccordionItem>
              </div>
            </div>
          </div>

          <div className="mt-12 md:mt-14 flex flex-col items-center gap-3 border-t border-[#E0E4DB] pt-10 md:pt-12">
            <p className="text-center text-sm font-medium text-[#4B5B54]">
              Download Sprocket for iPhone
            </p>
            <AppStoreBadgeLink prominent />
          </div>
        </div>
      </section>

      <section className="card p-6 mt-4">
        <h2 className="text-2xl font-extrabold mb-4">Policies</h2>
        <ul className="space-y-2 text-sm">
          <li>
            <Link href="/apps/sprocket/privacy-policy" className="text-blue-600 hover:underline">
              Privacy Policy (HTML, iOS)
            </Link>
          </li>
          <li>
            <Link href="/apps/sprocket/terms-of-use" className="text-blue-600 hover:underline">
              Terms of Use (HTML, iOS)
            </Link>
          </li>
          <li>
            <Link href="/apps/sprocket/android/privacy-policy" className="text-blue-600 hover:underline">
              Privacy Policy (HTML, Android)
            </Link>
          </li>
          <li>
            <Link href="/apps/sprocket/android/terms-of-use" className="text-blue-600 hover:underline">
              Terms of Use (HTML, Android)
            </Link>
          </li>
          <li>
            <Link href="/apps/sprocket/delete-account" className="text-blue-600 hover:underline">
              Delete account or data
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
}

/** Official Apple “Download on the App Store” badge — do not crop or recolour (App Store marketing guidelines). */
function AppStoreBadgeLink({ prominent = false, priority = false }) {
  const w = prominent ? 168 : 120;
  const h = Math.round((w * 40) / 119.66407);
  return (
    <Link
      href={SPROCKET_APP_STORE_US}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E4B]/35 focus-visible:ring-offset-2 transition-[transform,opacity] hover:opacity-95 motion-reduce:transition-none hover:scale-[1.02] motion-reduce:hover:scale-100 active:scale-[0.99]"
      aria-label="Download Sprocket on the App Store (opens in a new tab)"
    >
      <Image
        src="/assets/badges/download-on-the-app-store.svg"
        width={w}
        height={h}
        alt="Download on the App Store"
        className="h-auto w-full max-w-[168px]"
        priority={priority}
      />
    </Link>
  );
}

function Feature({ title, desc, icon = 'dot' }) {
  const icons = {
    mic: (
      <svg width="20" height="20" fill="currentColor" aria-hidden="true">
        <rect x="7" y="2" width="6" height="10" rx="3" />
        <path d="M4 10a6 6 0 0 0 12 0" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M10 16v3M7 19h6" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    ),
    untangle: (
      <svg width="20" height="20" fill="none" aria-hidden="true">
        <path d="M2 6h8a3 3 0 1 1 0 6H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M18 14h-8a3 3 0 1 1 0-6h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    bell: (
      <svg width="20" height="20" fill="none" aria-hidden="true">
        <path
          d="M5 9a5 5 0 0 1 10 0v4l2 2H3l2-2V9z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M8 17a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    note: (
      <svg width="20" height="20" fill="currentColor" aria-hidden="true">
        <rect x="4" y="3" width="12" height="14" rx="2" />
        <path d="M7 7h6M7 10h6M7 13h4" stroke="white" strokeWidth="1.5" />
      </svg>
    ),
    steps: (
      <svg width="20" height="20" fill="none" aria-hidden="true">
        <path d="M4 6h5v4h4v4h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="4" cy="6" r="2" fill="currentColor" />
        <circle cx="16" cy="14" r="2" fill="currentColor" />
      </svg>
    ),
    lock: (
      <svg width="20" height="20" fill="currentColor" aria-hidden="true">
        <rect x="4" y="9" width="12" height="8" rx="2" />
        <path d="M6 9V6a4 4 0 0 1 8 0v3" />
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
      <span className="shrink-0 mt-1 grid place-items-center rounded-lg border border-[#E0E4DB] bg-white/70 p-2 shadow-sm text-[#1B5E4B]">
        {icons[icon]}
      </span>
      <div>
        <h4 className="font-semibold text-[#1A2420]">{title}</h4>
        <p className="text-[#4B5B54] text-sm">{desc}</p>
      </div>
    </div>
  );
}

function AccordionItem({ question, children }) {
  return (
    <details className="group rounded-2xl border border-[#E0E4DB] bg-white/75 text-[#1A2420] open:bg-white transition">
      <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 list-none">
        <span className="text-base font-semibold select-none">{question}</span>
        <Chevron />
      </summary>
      <div className="px-4 pb-4 pt-0 text-[#4B5B54] text-sm leading-relaxed">{children}</div>
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
