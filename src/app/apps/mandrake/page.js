import Link from 'next/link';
import Image from 'next/image';

function Feature({ title, desc, icon = 'dot' }) {
  // Simple icon set (inline SVGs so you don’t pull extra deps)
  const icons = {
    dot: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5">
        <circle cx="12" cy="12" r="5" />
      </svg>
    ),
    tap: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5">
        <path d="M9 11a3 3 0 1 1 6 0v2.2l1.06.35a3 3 0 0 1 1.94 2.83V20H8v-3.62A3 3 0 0 1 9.94 13.9L11 13.6V11z" />
        <path d="M12 4a4 4 0 0 1 4 4h-2a2 2 0 1 0-2-2V4z" />
      </svg>
    ),
    lightning: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5">
        <path d="M13 2 3 14h7l-1 8 11-14h-7l0-6z" />
      </svg>
    ),
    timer: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5">
        <path d="M10 2h4v2h-4zM12 7a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm0 2v5h4" />
      </svg>
    ),
    star: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5">
        <path d="m12 2 3.1 6.3 6.9 1-5 4.8 1.2 6.9L12 18l-6.2 3 1.2-6.9-5-4.8 6.9-1z" />
      </svg>
    ),
    chart: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5">
        <path d="M4 20V4h2v16H4zm7 0V9h2v11h-2zm7 0v-7h2v7h-2z" />
      </svg>
    ),
    mood: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5">
        <circle cx="12" cy="12" r="9" />
        <circle cx="9" cy="10" r="1.5" fill="white" />
        <circle cx="15" cy="10" r="1.5" fill="white" />
        <path d="M8 14c1.2 1 2.5 1.5 4 1.5S14.8 15 16 14" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    shield: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5">
        <path d="M12 2 4 5v6c0 5 3.6 8.7 8 11 4.4-2.3 8-6 8-11V5l-8-3z" />
      </svg>
    ),
    phone: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5">
        <path d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm0 3h10v14H7V5z" />
      </svg>
    ),
  };

  return (
    <div className="flex items-start gap-3">
      <span className="shrink-0 mt-1 grid place-items-center rounded-lg border border-black/10 bg-white/60 p-2 shadow-sm">
        {icons[icon] || icons.dot}
      </span>
      <div>
        <h4 className="font-semibold text-neutral-900">{title}</h4>
        <p className="text-neutral-700 text-sm">{desc}</p>
      </div>
    </div>
  );
}

export default function Mandrake() {
  return (
    <main className="pb-10">
      {/* Top summary card */}
      <div className="card p-4 flex items-start gap-3 mt-2">
        <Image
          className="rounded-2xl border border-black/10"
          src="/assets/mandrake.png"
          width={64}
          height={64}
          alt="Mandrake logo"
          priority
        />
        <div>
          <div className="font-extrabold">Mandrake</div>
          <div className="text-muted text-sm">
            Mandrake gives you a private, lightweight way to spot urges, take action fast, and see what’s really
            going on beneath the surface. Every feature is designed to keep friction low, reinforcement immediate,
            and insights clear — all while staying entirely on your terms.
          </div>
        </div>
      </div>

      {/* HERO section with background + video showcase */}
      <section className="relative mt-3 overflow-hidden rounded-2xl border border-black/10">
        {/* Background image */}
        <div className="absolute inset-0 -z-10">
          <Image
            src="/img/mandrake-card-background.png"
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
              Inside Mandrake
            </h1>
            <p className="mt-3 text-white/85 max-w-2xl mx-auto">
              A quick look at logging, fast tactics, and the insight flow. All private,
              always on your terms.
            </p>
          </div>

          {/* Video */}
          <div className="mt-6 md:mt-8">
            <div className="relative max-w-4xl mx-auto flex justify-center">
              <div className="rounded-xl border border-white/20 shadow-2xl overflow-hidden bg-black/50 backdrop-blur-sm">
                <video
                  className="w-full h-auto aspect-video"
                  src="/vid/mandrake_90s.mp4"
                  poster="/assets/mandrake.png"
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
                href="/apps/mandrake/android"
                className="inline-flex items-center justify-center rounded-2xl px-6 h-12 text-base font-semibold bg-red-600 text-white hover:bg-red-700 transition"
              >
                Get it on Android
              </Link>
              <Link
                href="/apps/mandrake/ios"
                className="inline-flex items-center justify-center rounded-2xl px-6 h-12 text-base font-semibold bg-white text-black hover:bg-white/90 transition border border-black/10"
              >
                Get it on iOS
              </Link>
            </div>
          </div>

          {/* Key Features (NEW) */}
          <div className="mt-10 md:mt-12">
            <h2 className="text-2xl md:text-[28px] font-extrabold text-white text-center md:text-left">
              Key Features
            </h2>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <Feature
                icon="tap"
                title="One-Tap Logging"
                desc="Quickly note when an urge hits, without friction."
              />
              <Feature
                icon="lightning"
                title="Fast Tactics Menu"
                desc="Choose from practical actions (walk, music, call/text, shower, jot it down, etc.)."
              />
              <Feature
                icon="timer"
                title="Wave Timer"
                desc="Optional 10–30 min timer to help ride out the peak safely."
              />
              <Feature
                icon="star"
                title="Instant Reinforcement"
                desc="Subtle haptics, points, and micro-messages for every logged win."
              />
              <Feature
                icon="chart"
                title="Pattern Insights"
                desc="Heatmaps and trends show when urges spike and which tactics help most."
              />
              <Feature
                icon="mood"
                title="Mood Tracking"
                desc="Emoji-based check-ins before and after each urge log."
              />
              <Feature
                icon="shield"
                title="Quiet Safety Rails"
                desc="Gentle, optional signposting if heavy patterns appear."
              />
              <Feature
                icon="shield"
                title="Private by Default"
                desc="Local-first storage; export or delete anytime."
              />
              <Feature
                icon="phone"
                title="Cross-Platform Access"
                desc="Available on both Android and iOS."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Policies section (separate from hero) */}
      <section className="card p-6 mt-4">
        <h2 className="text-2xl font-extrabold mb-4">Policies</h2>

        <div className="mb-6">
          <h3 className="text-xl font-bold">Android</h3>
          <ul className="list-disc ml-5 mt-2 space-y-1 text-red-600">
            <li>
              <Link href="/assets/policies/Mandrake_Disclaimer_16plus.pdf">
                Disclaimer (PDF)
              </Link>
            </li>
            <li>
              <Link href="/assets/policies/Mandrake_Privacy_Policy_16plus.pdf">
                Privacy Policy (PDF)
              </Link>
            </li>
            <li>
              <Link href="/assets/policies/Mandrake_Terms_of_Service_16plus.pdf">
                Terms of Service (PDF)
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-bold">iOS</h3>
          <ul className="list-disc ml-5 mt-2 space-y-1 text-red-600">
            <li>
              <Link href="/assets/policies/Mandrake_Disclaimer_iOS.pdf">
                Disclaimer (PDF)
              </Link>
            </li>
            <li>
              <Link href="/assets/policies/Mandrake_Terms_of_Service_iOS.pdf">
                Terms of Service (PDF)
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
