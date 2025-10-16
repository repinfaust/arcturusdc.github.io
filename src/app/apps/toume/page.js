import Link from 'next/link';
import Image from 'next/image';

export default function TouMe() {
  return (
    <main className="pb-10">
      {/* Top summary card */}
      <div className="card p-4 flex items-start gap-3 mt-2">
        <Image
          className="rounded-2xl border border-black/10"
          src="/img/tou.me_logo.jpeg"
          width={64}
          height={64}
          alt="Tou.me logo"
          priority
        />
        <div>
          <div className="font-extrabold">Tou.me</div>
          <div className="text-muted text-sm">For you, for me, for them.</div>
          <p className="mt-2 text-sm text-neutral-700">
            Tou.me is a calm, logistics-first family planner designed for separated, divorced,
            and blended families. Unlike legal or chat-heavy apps, Tou.me focuses purely on
            the practical: schedules, handovers, essentials, expenses, and wellbeing. It’s
            separation-aware but never adversarial, helping families avoid misunderstandings
            and reduce friction. With neutral language, structured flows, and easy share-outs
            to calendars or WhatsApp, Tou.me makes the everyday realities of raising children
            across two homes clearer, calmer, and fairer.
          </p>
        </div>
      </div>

      {/* HERO section with background + video */}
      <section className="relative mt-3 overflow-hidden rounded-2xl border border-black/10">
        {/* Background image */}
        <div className="absolute inset-0 -z-10">
          <Image
            src="/img/toume-card-background.png"
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
              Inside Tou.me
            </h1>
            <p className="mt-3 text-white/85 max-w-2xl mx-auto">
              Practical tools for two-home families — calm, structured, and neutral by design.
            </p>
          </div>

          {/* Video showcase */}
          <div className="mt-6 md:mt-8">
            <div className="relative max-w-4xl mx-auto flex justify-center">
              <div className="rounded-xl border border-white/20 shadow-2xl overflow-hidden bg-black/50 backdrop-blur-sm">
                <video
                  className="w-full h-auto aspect-video"
                  src="/vid/toume_video_showcase.mp4"
                  poster="/img/tou.me_logo.jpeg"
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
              <Feature title="Calendar" desc="Set up schedules with templates for repeats and term-time changes." icon="calendar" />
              <Feature title="Handover Playbooks" desc="Clear checklists and timings for smooth, predictable handovers." icon="book" />
              <Feature title="Two-Home Inventory" desc="Track essentials across both homes — uniforms, meds, devices." icon="box" />
              <Feature title="Shared Expenses (Tracking only)" desc="Log shared costs and balances — no payments to argue over." icon="coins" />
              <Feature title="Child Wellbeing" desc="Note mood, sleep, and needs — keep things supportive, not forensic." icon="heart" />
              <Feature title="Weekly Digest" desc="A neutral summary you can share to keep everyone aligned." icon="digest" />
              <Feature title="Editable Checklists" desc="Real-world admin lists you can reuse and adapt quickly." icon="checklist" />
              <Feature title="Neutral Share-Outs" desc="Generate summaries for WhatsApp, SMS, email, or calendars." icon="share" />
              <Feature title="Privacy Guardrails" desc="GDPR-first, encrypted, and designed to avoid conflict." icon="lock" />
            </div>

            {/* FAQ accordion */}
            <div className="mt-10">
              <h2 className="text-2xl md:text-[28px] font-extrabold text-white text-center md:text-left">
                FAQ
              </h2>
              <div className="mt-5 space-y-3">
                <AccordionItem question="Is Tou.me a legal or court app?">
                  <p>
                    No. Tou.me avoids court framing, chat logs, and evidence trails. It’s a calm logistics organiser,
                    not a legal tool.
                  </p>
                </AccordionItem>
                <AccordionItem question="Can I chat in Tou.me?">
                  <p>
                    No. There’s no in-app messaging. Instead, Tou.me generates structured summaries you can share through
                    WhatsApp, SMS, or email.
                  </p>
                </AccordionItem>
                <AccordionItem question="Do both parents need to use it?">
                  <p>
                    It works best if everyone’s involved, but it’s still useful solo. You can export schedules, checklists,
                    and digests to keep the other side informed without them needing the app.
                  </p>
                </AccordionItem>
                <AccordionItem question="How is my data protected?">
                  <p>
                    All data is encrypted in transit and at rest, hosted in the UK/EU under GDPR rules. No ads, no trackers.
                  </p>
                </AccordionItem>
                <AccordionItem question="What if only I want to use it with a grandparent or carer?">
                  <p>
                    That’s supported. You can invite carers or viewers with limited roles and only share what’s needed.
                  </p>
                </AccordionItem>
                <AccordionItem question="What about payments or reimbursements?">
                  <p>
                    Tou.me only tracks shared expenses and balances. It doesn’t handle payments — this avoids complexity and conflict.
                  </p>
                </AccordionItem>
                <AccordionItem question="Who is Tou.me for?">
                  <p>
                    Primarily separated/divorced parents raising kids across two homes, but also blended families, grandparents,
                    step-parents, and carers who help coordinate.
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
      <Link href="/apps/toume/privacy-policy">Privacy Policy</Link>
    </li>
    <li>
      <Link href="/apps/toume/terms">Terms & Conditions</Link>
    </li>
    <li>
      <Link href="/assets/policies/Toume_TermsOfService.pdf" target="_blank" rel="noopener noreferrer">
        Terms of Service
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
    calendar: (
      <svg width="20" height="20" fill="currentColor" aria-hidden="true">
        <rect x="3" y="4" width="14" height="13" rx="2" />
        <path d="M3 8h14" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    book: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M4 3h9a3 3 0 013 3v11H7a3 3 0 01-3-3V3z" />
        <path d="M7 3v11a3 3 0 003 3h6" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    box: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M3 6l7-3 7 3v8l-7 3-7-3V6z" />
        <path d="M10 3v14" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    coins: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <ellipse cx="10" cy="5" rx="6" ry="3" />
        <path d="M4 5v6c0 1.7 2.7 3 6 3s6-1.3 6-3V5" />
      </svg>
    ),
    heart: (
      <svg width="20" height="20" fill="currentColor" aria-hidden="true">
        <path d="M10 17s-6-3.6-6-8a4 4 0 017-2.6A4 4 0 0116 9c0 4.4-6 8-6 8z" />
      </svg>
    ),
    digest: (
      <svg width="20" height="20" fill="currentColor" aria-hidden="true">
        <rect x="3" y="4" width="14" height="13" rx="2" />
        <path d="M6 7h8M6 10h8M6 13h8" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    checklist: (
      <svg width="20" height="20" fill="currentColor" aria-hidden="true">
        <path d="M4 6h9M4 10h9M4 14h9" stroke="currentColor" strokeWidth="2" />
        <path d="M14 6l2 2 3-3M14 10l2 2 3-3M14 14l2 2 3-3" />
      </svg>
    ),
    share: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <circle cx="5" cy="10" r="2" />
        <circle cx="15" cy="5" r="2" />
        <circle cx="15" cy="15" r="2" />
        <path d="M7 10l6-4M7 10l6 4" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    lock: (
      <svg width="20" height="20" fill="currentColor" aria-hidden="true">
        <rect x="4" y="9" width="12" height="8" rx="2" />
        <path d="M6 9V6a4 4 0 018 0v3" />
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
