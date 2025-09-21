import Link from 'next/link';
import Image from 'next/image';

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
            Private urge logging, quick tactics, and pattern insights.
          </div>
          <p className="mt-2 text-sm text-neutral-700">
            Mandrake gives you a private, lightweight way to spot urges, take action fast, and see
            what’s really going on beneath the surface. Every feature is designed to keep friction
            low, reinforcement immediate, and insights clear — all while staying entirely on your
            terms.
          </p>
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

          {/* Key Features */}
          <div className="mt-10 md:mt-12">
            <h2 className="text-2xl md:text-[28px] font-extrabold text-white text-center md:text-left">
              Key Features
            </h2>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-white">
              <Feature
                title="One-Tap Logging"
                desc="Quickly note when an urge hits, without friction."
                icon="log"
              />
              <Feature
                title="Fast Tactics Menu"
                desc="Choose from practical actions (walk, music, call/text, shower, jot it down, etc.)."
                icon="bolt"
              />
              <Feature
                title="Wave Timer"
                desc="Optional 10–30 min timer to help ride out the peak safely."
                icon="timer"
              />
              <Feature
                title="Instant Reinforcement"
                desc="Subtle haptics, points, and micro-messages for every logged win."
                icon="star"
              />
              <Feature
                title="Pattern Insights"
                desc="Heatmaps and trends show when urges spike and which tactics help most."
                icon="chart"
              />
              <Feature
                title="Mood Tracking"
                desc="Emoji-based check-ins before and after each urge log."
                icon="smile"
              />
              <Feature
                title="Quiet Safety Rails"
                desc="Gentle, optional signposting if heavy patterns appear."
                icon="shield"
              />
              <Feature
                title="Private by Default"
                desc="Local-first storage; export or delete anytime."
                icon="lock"
              />
              <Feature
                title="Cross-Platform Access"
                desc="Available on both Android and iOS."
                icon="device"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Policies section */}
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

/* --- Feature component --- */
function Feature({ title, desc, icon = 'dot' }) {
  const icons = {
    log: (
      <svg width="20" height="20" fill="currentColor">
        <path d="M4 4h12v2H4zm0 5h12v2H4zm0 5h8v2H4z" />
      </svg>
    ),
    bolt: (
      <svg width="20" height="20" fill="currentColor">
        <path d="M11 1L3 10h5l-1 9 8-11h-5z" />
      </svg>
    ),
    timer: (
      <svg width="20" height="20" fill="currentColor">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M10 5v5l3 3" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    ),
    star: (
      <svg width="20" height="20" fill="currentColor">
        <path d="M10 1l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
      </svg>
    ),
    chart: (
      <svg width="20" height="20" fill="currentColor">
        <path d="M4 12h2v6H4zm5-4h2v10H9zm5-6h2v16h-2z" />
      </svg>
    ),
    smile: (
      <svg width="20" height="20" fill="currentColor">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M6 8h.01M14 8h.01M7 13a5 5 0 0 0 6 0" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    shield: (
      <svg width="20" height="20" fill="currentColor">
        <path d="M10 1l9 4v6c0 5-3.5 9-9 11-5.5-2-9-6-9-11V5z" />
      </svg>
    ),
    lock: (
      <svg width="20" height="20" fill="currentColor">
        <rect x="4" y="9" width="12" height="8" rx="2" />
        <path d="M6 9V6a4 4 0 0 1 8 0v3" />
      </svg>
    ),
    device: (
      <svg width="20" height="20" fill="currentColor">
        <rect x="6" y="2" width="8" height="16" rx="2" />
      </svg>
    ),
    dot: (
      <svg width="20" height="20" fill="currentColor">
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
