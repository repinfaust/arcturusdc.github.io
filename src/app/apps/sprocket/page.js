import Link from 'next/link';
import Image from 'next/image';

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
        <div>
          <div className="flex items-center gap-2">
            <Image
              src="/img/sprocket-wordmark.png"
              width={170}
              height={48}
              alt="Sprocket wordmark"
              priority
            />
          </div>
          <div className="text-muted text-sm">Voice and text support for stressful tasks.</div>
          <p className="mt-2 text-sm text-neutral-700">
            Sprocket is a calm assistant for people who feel overwhelmed by everyday admin,
            reminders, and difficult messages. It helps users go from confusion to one clear
            next step using plain language, flexible voice or text guidance, and private-by-default flows.
          </p>
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
              Calm support through voice or text to make sense of stressful messages and take one safe next step.
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
                title="Voice and Text Help"
                desc="Speak or type to get support without navigating complex menus."
                icon="mic"
              />
              <Feature
                title="Untangle Text"
                desc="Turn difficult letters or emails into plain meaning, urgency, and one clear next step."
                icon="untangle"
              />
              <Feature
                title="Draft Reply Support"
                desc="Generate short, polite, or firm reply drafts you can copy and edit."
                icon="reply"
              />
              <Feature
                title="Reminders & Memory"
                desc="Store reminders and key notes in a simple, low-pressure flow."
                icon="note"
              />
              <Feature
                title="Sensitive Data Guardrails"
                desc="Detects likely sensitive details and offers redaction before save or share."
                icon="shield"
              />
              <Feature
                title="Private by Default"
                desc="No required account and no forced cloud dependency for basic use."
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
                    Sprocket is for anyone who feels stressed by everyday admin or unclear messages,
                    especially users who want calm, plain-language guidance.
                  </p>
                </AccordionItem>
                <AccordionItem question="What does Untangle Text do?">
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
                    Sprocket is designed privacy-first. Sensitive details can be redacted, and raw
                    message text is not automatically saved by default flows.
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
        </div>
      </section>

      <section className="card p-6 mt-4">
        <h2 className="text-2xl font-extrabold mb-4">Policies</h2>
        <ul className="space-y-2 text-sm">
          <li>
            <Link href="/apps/sprocket/privacy-policy" className="text-blue-600 hover:underline">
              Privacy Policy (HTML)
            </Link>
          </li>
          <li>
            <Link href="/apps/sprocket/terms-of-use" className="text-blue-600 hover:underline">
              Terms of Use (HTML)
            </Link>
          </li>
        </ul>
      </section>
    </main>
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
    reply: (
      <svg width="20" height="20" fill="currentColor" aria-hidden="true">
        <path d="M8 5L2 10l6 5v-3h3c3 0 5 1 7 4-1-5-3-8-7-8H8V5z" />
      </svg>
    ),
    note: (
      <svg width="20" height="20" fill="currentColor" aria-hidden="true">
        <rect x="4" y="3" width="12" height="14" rx="2" />
        <path d="M7 7h6M7 10h6M7 13h4" stroke="white" strokeWidth="1.5" />
      </svg>
    ),
    shield: (
      <svg width="20" height="20" fill="currentColor" aria-hidden="true">
        <path d="M10 1l8 4v5c0 5-3 8-8 10-5-2-8-5-8-10V5l8-4z" />
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
