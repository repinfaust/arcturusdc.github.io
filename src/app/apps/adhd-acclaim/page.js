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
                href="/apps/adhd-acclaim/android"
                className="inline-flex items-center justify-center rounded-2xl px-6 h-12 text-base font-semibold bg-red-600 text-white hover:bg-red-700 transition"
              >
                Get it on Android
              </Link>
              <Link
                href="/apps/adhd-acclaim/ios"
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
              {/* Feature list remains to be updated with ADHD Acclaim copy */}
            </div>

            {/* FAQ accordion placeholder */}
            <div className="mt-10">
              <h2 className="text-2xl md:text-[28px] font-extrabold text-white text-center md:text-left">
                FAQ
              </h2>
              <div className="mt-5 space-y-3">
                {/* FAQ items remain to be updated with ADHD Acclaim copy */}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Policies section placeholder */}
      <section className="card p-6 mt-4">
        <h2 className="text-2xl font-extrabold mb-4">Policies</h2>
        {/* Policies will be added here */}
      </section>
    </main>
  );
}

/* --- Feature component + Accordion component remain the same as before --- */
