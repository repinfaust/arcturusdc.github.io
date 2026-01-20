import Link from 'next/link';
import Image from 'next/image';

export default function ADHDAcclaim() {
  return (
    <main className="pb-10">
      {/* Top summary card */}
      <div className="card p-4 flex items-start gap-3 mt-2">
        <Image
          className="rounded-2xl border border-black/10"
          src="/img/adhdacclaim_logo_1024x1024.png"
          width={64}
          height={64}
          alt="ADHD Acclaim logo"
          priority
        />
        <div>
          <div className="font-extrabold">ADHD Acclaim</div>
          <div className="text-muted text-sm">
            Celebrate wins, earn rewards, feel good — on your terms.
          </div>
          <p className="mt-2 text-sm text-neutral-700">
            ADHD Acclaim is a simple, gamified reward app built for ADHD brains. Instead of pressure,
            deadlines, or streaks, you get to define your own “Wins” — anything from brushing your teeth
            to finishing a project. Every win earns you points, progress, and celebration you can actually
            feel good about. Trade points for rewards you set yourself, and enjoy visible progress without
            the guilt of missed tasks. ADHD Acclaim is all about joy, not judgment.
          </p>
        </div>
      </div>

      {/* HERO section with background + video showcase */}
      <section className="relative mt-3 overflow-hidden rounded-2xl border border-black/10">
        {/* Background image */}
        <div className="absolute inset-0 -z-10">
          <Image
            src="/img/adhdacclaim-card-background.png"
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
              Inside ADHD Acclaim
            </h1>
            <p className="mt-3 text-white/85 max-w-2xl mx-auto">
              A quick look at how wins, points, and rewards come together — pressure-free.
            </p>
          </div>

          {/* Video */}
          <div className="mt-6 md:mt-8">
            <div className="relative max-w-4xl mx-auto flex justify-center">
              <div className="rounded-xl border border-white/20 shadow-2xl overflow-hidden bg-black/50 backdrop-blur-sm">
                <video
                  className="w-full h-auto aspect-video"
                  src="/vid/ADHDAcclaim_showcase_vid.mp4"
                  poster="/img/adhdacclaim_logo_1024x1024.png"
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

            {/* CTAs – centred */}
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link
                href="https://play.google.com/store/apps/details?id=com.adhdacclaim.app&pcampaignid=web_share"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-2xl px-6 h-12 text-base font-semibold bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Get ADHD Acclaim on Google Play (opens in a new tab)"
              >
                Get it on Android
              </Link>
              <button
                disabled
                className="inline-flex items-center justify-center rounded-2xl px-6 h-12 text-base font-semibold bg-white text-black opacity-70 cursor-not-allowed border border-black/10"
              >
                iOS – Coming Soon
              </button>
            </div>
          </div>

          {/* Key Features */}
          <div className="mt-10 md:mt-12">
            <h2 className="text-2xl md:text-[28px] font-extrabold text-white text-center md:text-left">
              Key Features
            </h2>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-white">
              <Feature
                title="One-Tap Wins"
                desc="Log any achievement instantly, big or small."
                icon="log"
              />
              <Feature
                title="Instant Points"
                desc="Earn points and get celebratory feedback the moment you log a win."
                icon="bolt"
              />
              <Feature
                title="Visible Progress"
                desc="See your points grow and track how far you’ve come."
                icon="chart"
              />
              <Feature
                title="Personal Rewards"
                desc="Create your own meaningful rewards and cash in points when you’re ready."
                icon="gift"
              />
              <Feature
                title="No Pressure, No Punishment"
                desc="Forget streaks, deadlines, and overdue tasks — wins only, never shame."
                icon="shield"
              />
              <Feature
                title="Celebrate Everything"
                desc="Fun visuals and uplifting animations every time you succeed."
                icon="star"
              />
            </div>

            {/* FAQ accordion */}
            <div className="mt-10">
              <h2 className="text-2xl md:text-[28px] font-extrabold text-white text-center md:text-left">
                FAQ
              </h2>
              <div className="mt-5 space-y-3">
                <AccordionItem question="Is ADHD Acclaim a task manager or planner?">
                  <p>
                    No. ADHD Acclaim is not about schedules, lists, or productivity hacks. It’s a
                    celebration app where you log wins and enjoy rewards — at your own pace.
                  </p>
                </AccordionItem>
                <AccordionItem question="What counts as a “Win”?">
                  <p>
                    Anything you decide! Wins can be everyday actions (like making your bed), personal
                    victories (like sending a message you’ve been avoiding), or big milestones. You
                    choose what matters.
                  </p>
                </AccordionItem>
                <AccordionItem question="Do I have to use the app every day?">
                  <p>
                    Not at all. There are no streaks or penalties. Log wins whenever you like — ADHD
                    Acclaim will always celebrate with you.
                  </p>
                </AccordionItem>
                <AccordionItem question="Are rewards built-in or do I add my own?">
                  <p>
                    You create your own rewards, tailored to what motivates you — from “watch an
                    episode of my favourite show” to “buy that snack I’ve been craving.”
                  </p>
                </AccordionItem>
                <AccordionItem question="Is my data private?">
                  <p>
                    Yes. Wins and rewards are stored on your device, and you stay in control of your own
                    data.
                  </p>
                </AccordionItem>
                <AccordionItem question="Who is ADHD Acclaim for?">
                  <p>
                    Anyone who wants positive reinforcement without pressure. While designed for ADHD
                    users, it’s helpful for anyone who finds motivation and joy in celebrating progress.
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
            <Link href="/apps/adhd-acclaim/privacy-policy" className="text-blue-600 hover:underline">
              Privacy Policy (HTML)
            </Link>
          </li>
          <li>
            <Link
              href="/assets/policies/ADHD_Acclaim_TermsOfUse.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Terms of Use (PDF)
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
    log: (
      <svg width="20" height="20" fill="currentColor" aria-hidden="true">
        <path d="M4 4h12v2H4zm0 5h12v2H4zm0 5h8v2H4z" />
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
    gift: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M2 7h16v4H2z" />
        <path d="M9 2c-.8 0-1.5.6-1.5 1.4 0 .9.7 1.6 1.6 1.6H10V2H9zM11 2v3h.9c.9 0 1.6-.7 1.6-1.6 0-.8-.7-1.4-1.5-1.4H11z" />
        <path d="M2 11h7v7H4a2 2 0 0 1-2-2v-5zm9 0h7v5a2 2 0 0 1-2 2h-5v-7z" />
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
