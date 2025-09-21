// src/components/HeroWithApps.jsx
export default function HeroWithApps() {
  return (
    <section
      aria-label="Featured apps"
      className="mt-12 mb-16 rounded-2xl border border-black/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-2xl p-6 sm:p-8 lg:p-10"
    >
      <div className="mb-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Apps</h2>
        <p className="mt-2 text-muted max-w-2xl">
          Privacy-first apps designed around real needs. Simple, focused, and compliant.
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        {/* Mandrake */}
        <a
          href="/apps/mandrake"
          className="group rounded-2xl border border-black/10 p-4 sm:p-5 hover:shadow-lg transition-shadow bg-white"
        >
          <div className="flex items-center gap-3">
            <img
              src="/assets/mandrake.png"
              alt="Mandrake"
              width="56"
              height="56"
              className="rounded-2xl border border-black/10"
            />
            <div>
              <div className="font-semibold">Mandrake</div>
              <div className="text-muted text-sm">
                Private urge logging, quick tactics, pattern insights.
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <span className="badge">Android &amp; iOS</span>
            <span className="badge">Privacy-first</span>
          </div>
          <div className="mt-4 text-red-700 font-medium">Learn more →</div>
        </a>

        {/* Tou.me */}
        <a
          href="/apps/toume"
          className="group rounded-2xl border border-black/10 p-4 sm:p-5 hover:shadow-lg transition-shadow bg-white"
        >
          <div className="flex items-center gap-3">
            <img
              src="/assets/toume.png"
              alt="Tou.me"
              width="56"
              height="56"
              className="rounded-2xl border border-black/10"
            />
            <div>
              <div className="font-semibold">Tou.me</div>
              <div className="text-muted text-sm">
                Coming soon — for you, for me, for them.
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <span className="badge">iOS</span>
            <span className="badge">Privacy-first</span>
          </div>
          <div className="mt-4 text-red-700 font-medium">See details →</div>
        </a>
      </div>

      <div className="mt-6">
        <a href="/apps" className="btn-secondary">Explore all apps</a>
      </div>
    </section>
  );
}
