import Link from 'next/link';
import Image from 'next/image';

export default function Mandrake() {
  return (
    <main className="pb-10">
      {/* Top summary card */}
      <div className="card p-4 flex items-center gap-3 mt-2">
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
        </div>
      </div>

      {/* HERO with background + video */}
      <section className="relative mt-3 overflow-hidden rounded-2xl border border-black/10">
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
          <div className="max-w-4xl">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
              See Mandrake in action
            </h1>
            <p className="mt-3 text-white/85 max-w-2xl">
              A quick look at logging, fast tactics, and the insight flow. All private,
              always on your terms.
            </p>
          </div>

          <div className="mt-6 md:mt-8">
            <div className="relative max-w-4xl">
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

            <div className="mt-5 flex flex-wrap gap-2">
              <Link className="btn btn-primary" href="/apps/mandrake/android">
                Get it on Android
              </Link>
              <Link className="btn btn-secondary" href="/apps/mandrake/ios">
                Get it on iOS
              </Link>
              <Link className="btn" href="/apps/mandrake#features">
                Explore features
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Platform cards */}
      <div className="card p-6 mt-3">
        <div className="text-2xl font-extrabold mb-2">Choose a platform</div>
        <div className="flex gap-2 flex-wrap">
          <Link className="btn btn-primary" href="/apps/mandrake/android">
            Android (Google Play)
          </Link>
          <Link className="btn btn-primary" href="/apps/mandrake/ios">
            iOS (Apple App Store)
          </Link>
        </div>
      </div>
    </main>
  );
}
