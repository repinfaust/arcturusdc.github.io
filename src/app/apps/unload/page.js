import Link from 'next/link';
import Image from 'next/image';

export default function Unload() {
  return (
    <main className="pb-10">
      {/* Top summary card */}
      <div className="card p-4 flex items-start gap-3 mt-2">
        <Image
          className="rounded-2xl border border-black/10 bg-white"
          src="/img/unload-logo.svg"
          width={64}
          height={64}
          alt="Unload logo"
          priority
        />
        <div>
          <div className="flex items-center gap-2">
            <Image
              src="/img/unload-wordmark.svg"
              width={180}
              height={44}
              alt="Unload wordmark"
              priority
            />
          </div>
          <div className="text-muted text-sm">Relief first. Momentum second.</div>
          <p className="mt-2 text-sm text-neutral-700">
            Unload is a calm, voice-first app that helps people set things down before
            asking them to move forward. It’s designed for overload, avoidance, and
            cognitive noise — a moment of relief before momentum.
          </p>
        </div>
      </div>

      {/* HERO section with background + video showcase */}
      <section className="relative mt-3 overflow-hidden rounded-2xl border border-black/10">
        <div className="absolute inset-0 -z-10">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(90% 70% at 50% 20%, rgba(170, 198, 181, 0.65), rgba(247, 242, 234, 0.2)), linear-gradient(180deg, #F7F2EA 0%, #EFE7DD 50%, #E9DED2 100%)',
            }}
          />
          <div className="absolute inset-0 bg-black/10" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/20" />
        </div>

        <div className="p-6 md:p-10">
          {/* Title + intro */}
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-extrabold text-[#2F2723] tracking-tight">
              Inside Unload
            </h1>
            <p className="mt-3 text-[#3F342E]/80 max-w-2xl mx-auto">
              A soft landing for the moments before clarity — speak it, set it down,
              and feel lighter.
            </p>
          </div>

          {/* Video */}
          <div className="mt-6 md:mt-8">
            <div className="relative max-w-4xl mx-auto flex justify-center">
              <div className="rounded-xl border border-black/10 shadow-2xl overflow-hidden bg-white/60 backdrop-blur-sm">
                <video
                  className="w-full h-auto aspect-video"
                  src="/vid/unload-demo-compressed.mp4"
                  poster="/img/unload-logo.svg"
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
                    'radial-gradient(60% 60% at 50% 50%, rgba(143, 184, 162, 0.4), rgba(0,0,0,0))',
                }}
              />
            </div>
          </div>

          {/* Key Features */}
          <div className="mt-10 md:mt-12">
            <h2 className="text-2xl md:text-[28px] font-extrabold text-[#2F2723] text-center md:text-left">
              Key Features
            </h2>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-[#2F2723]">
              <Feature
                title="Voice-First Unload"
                desc="Speak what’s heavy the moment it surfaces — no typing required."
                icon="mic"
              />
              <Feature
                title="Gentle Prompts"
                desc="Soft questions help you name what would make today easier."
                icon="leaf"
              />
              <Feature
                title="Containers & Places"
                desc="Tuck thoughts into safe containers or places so they stop looping."
                icon="box"
              />
              <Feature
                title="Relief Rewards"
                desc="Optional rewards that feel like permission, not pressure."
                icon="spark"
              />
              <Feature
                title="Private by Default"
                desc="No required integrations, accounts, or workplace access assumptions."
                icon="lock"
              />
              <Feature
                title="Lightweight Sessions"
                desc="Open, unload, close. If you feel lighter, it worked."
                icon="feather"
              />
            </div>

            {/* FAQ accordion */}
            <div className="mt-10">
              <h2 className="text-2xl md:text-[28px] font-extrabold text-[#2F2723] text-center md:text-left">
                FAQ
              </h2>
              <div className="mt-5 space-y-3">
                <AccordionItem question="Is Unload a task manager or planner?">
                  <p>
                    No. Unload is for the moment before that. It helps you set things down
                    and find relief, not organise a system.
                  </p>
                </AccordionItem>
                <AccordionItem question="Do I need to be ready to act to use it?">
                  <p>
                    Not at all. Unload is designed for overload and avoidance — the goal is
                    to feel lighter first.
                  </p>
                </AccordionItem>
                <AccordionItem question="Is it voice-only?">
                  <p>
                    Voice is the default, but you can also type if that feels easier in the moment.
                  </p>
                </AccordionItem>
                <AccordionItem question="How are rewards handled?">
                  <p>
                    Rewards are optional and gentle. They’re about self-permission, not
                    streaks, points, or pressure.
                  </p>
                </AccordionItem>
                <AccordionItem question="Is my data private?">
                  <p>
                    Yes. Unload is designed to keep cognition private and personal. Nothing is
                    shared unless you choose to.
                  </p>
                </AccordionItem>
                <AccordionItem question="Who is Unload for?">
                  <p>
                    Anyone feeling overloaded — especially neurodivergent or burnout-prone
                    users who want relief without integrations or complex systems.
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
        <ul className="space-y-2 text-sm">
          <li>
            <Link href="/apps/unload/privacy-policy" className="text-blue-600 hover:underline">
              Privacy Policy (HTML)
            </Link>
          </li>
          <li>
            <Link href="/apps/unload/terms-of-use" className="text-blue-600 hover:underline">
              Terms of Use (HTML)
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
    mic: (
      <svg width="20" height="20" fill="currentColor" aria-hidden="true">
        <path d="M10 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
        <path d="M4 10a6 6 0 0 0 12 0" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M10 16v3" stroke="currentColor" strokeWidth="2" />
        <path d="M7 19h6" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    leaf: (
      <svg width="20" height="20" fill="currentColor" aria-hidden="true">
        <path d="M4 12c6-8 12-8 12-8s-1 6-8 12c-2 2-4 2-4 2s0-2 0-4z" />
      </svg>
    ),
    box: (
      <svg width="20" height="20" fill="currentColor" aria-hidden="true">
        <rect x="4" y="6" width="12" height="10" rx="2" />
        <path d="M4 9h12" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    spark: (
      <svg width="20" height="20" fill="currentColor" aria-hidden="true">
        <path d="M10 1l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z" />
      </svg>
    ),
    lock: (
      <svg width="20" height="20" fill="currentColor" aria-hidden="true">
        <rect x="4" y="9" width="12" height="8" rx="2" />
        <path d="M6 9V6a4 4 0 0 1 8 0v3" />
      </svg>
    ),
    feather: (
      <svg width="20" height="20" fill="currentColor" aria-hidden="true">
        <path d="M16 4c-4 0-8 4-8 8v4h4c4 0 8-4 8-8V4h-4z" />
        <path d="M8 16l-4 4" stroke="currentColor" strokeWidth="2" />
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
      <span className="shrink-0 mt-1 grid place-items-center rounded-lg border border-black/10 bg-white/50 p-2 shadow-sm text-[#2F2723]">
        {icons[icon]}
      </span>
      <div>
        <h4 className="font-semibold text-[#2F2723]">{title}</h4>
        <p className="text-[#3F342E]/80 text-sm">{desc}</p>
      </div>
    </div>
  );
}

/* --- Accordion components (native <details> for accessibility) --- */
function AccordionItem({ question, children }) {
  return (
    <details className="group rounded-2xl border border-black/10 bg-white/60 text-[#2F2723] open:bg-white/80 transition">
      <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 list-none">
        <span className="text-base font-semibold select-none">{question}</span>
        <Chevron />
      </summary>
      <div className="px-4 pb-4 pt-0 text-[#3F342E]/90 text-sm leading-relaxed">
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
