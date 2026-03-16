import Link from 'next/link';

const COLORS = {
  bg: '#121214',
  surface: '#1E1E22',
  surface2: '#28282E',
  border: '#2E2E36',
  text: '#F0F0F2',
  muted: '#8A8A9A',
  accent: '#E8196E',
  accentDim: '#2A0D1A',
};

const features = [
  {
    title: 'Maintenance Tracker',
    desc: 'Structured service intervals, ride-based counters, notes, and overdue visibility built around actual bike ownership.',
  },
  {
    title: 'Setup Calculators',
    desc: 'Suspension and tyre setup tools that store bike-specific inputs so the starting point is quick every time.',
  },
  {
    title: 'Strava Ride Sync',
    desc: 'Optional read-only sync updates qualifying mountain bike rides without requiring manual entry after every ride.',
  },
  {
    title: 'AI Advisor',
    desc: 'Premium-only guidance for setup and maintenance questions, with bike context included and no personal profile data sent.',
  },
  {
    title: 'Free + Premium Tiers',
    desc: 'Free covers one bike, setup tools, Strava sync, and partner discounts. Premium unlocks unlimited bikes and the full tracker.',
  },
  {
    title: 'Partner Offers',
    desc: 'Commercial partner links and discount surfaces can sit inside the product without turning the app into an ad network.',
  },
];

const scope = [
  'Android and iOS app positioning is now reflected in the policy set.',
  'Signed-off brand system: magenta + anthracite, with white icon accents.',
  'Video is still pending, so the hero media remains a placeholder panel.',
  'Privacy and terms routes are aligned to the latest supplied HTML source files.',
];

export const metadata = {
  title: 'Dialled MTB — Arcturus Digital Consulting',
  description: 'Dialled MTB landing page.',
};

export default function DialledMtbPage() {
  return (
    <main
      className="pb-12"
      style={{
        background:
          'linear-gradient(180deg, rgba(232,25,110,0.06) 0%, rgba(18,18,20,0) 220px)',
      }}
    >
      <section
        className="relative mt-2 overflow-hidden rounded-[28px] border px-5 py-6 md:px-8 md:py-8"
        style={{
          background: COLORS.bg,
          borderColor: COLORS.border,
          color: COLORS.text,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-100"
          style={{
            background:
              'radial-gradient(circle at 80% 18%, rgba(232,25,110,0.16), transparent 26%), radial-gradient(circle at 14% 90%, rgba(232,25,110,0.08), transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))',
          }}
        />
        <div className="relative mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center gap-3">
            <Badge>Signed-Off Brand System</Badge>
            <Badge>Android + iOS</Badge>
            <Badge>Free + Premium</Badge>
          </div>

          <div className="mt-6 grid gap-8 md:grid-cols-[1.15fr_0.85fr] md:items-center">
            <div>
              <div className="flex items-center gap-4">
                <div
                  className="grid h-16 w-16 place-items-center rounded-2xl border"
                  style={{ borderColor: COLORS.border, background: COLORS.surface }}
                >
                  <DialledMark size={42} />
                </div>
                <div>
                  <p
                    className="text-xs font-black uppercase tracking-[0.28em]"
                    style={{ color: COLORS.accent }}
                  >
                    Mountain Ready
                  </p>
                  <h1 className="mt-1 text-4xl font-black tracking-[0.03em] md:text-6xl">
                    DIALLED MTB
                  </h1>
                </div>
              </div>

              <p className="mt-5 text-xl font-semibold md:text-2xl" style={{ color: COLORS.muted }}>
                Set up right. Every ride.
              </p>
              <p className="mt-4 max-w-[62ch] text-base leading-7 md:text-lg" style={{ color: '#C8C8D8' }}>
                Dialled MTB is a maintenance and setup companion for mountain bikers. The current
                positioning is a darker, sharper magenta-led brand system with one-bike free access,
                Premium unlocks, read-only Strava sync, and a contextual AI advisor.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <PrimaryLink href="/apps/dialled-mtb/privacy-policy">Privacy Policy</PrimaryLink>
                <SecondaryLink href="/apps/dialled-mtb/terms-of-use">Terms of Use</SecondaryLink>
              </div>
            </div>

            <div
              className="rounded-[24px] border p-4 md:p-5"
              style={{ borderColor: COLORS.border, background: COLORS.surface }}
            >
              <div
                className="aspect-video rounded-[20px] border p-5"
                style={{
                  borderColor: COLORS.border,
                  background:
                    'linear-gradient(180deg, rgba(232,25,110,0.12), rgba(42,13,26,0.8))',
                }}
              >
                <div className="flex h-full flex-col justify-between">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p
                        className="text-[11px] font-black uppercase tracking-[0.24em]"
                        style={{ color: COLORS.accent }}
                      >
                        Placeholder
                      </p>
                      <h2 className="mt-2 text-2xl font-black md:text-3xl">Product Walkthrough</h2>
                    </div>
                    <div
                      className="rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]"
                      style={{ borderColor: '#4A1A2D', color: COLORS.text, background: COLORS.accentDim }}
                    >
                      Video Pending
                    </div>
                  </div>

                  <div
                    className="rounded-[18px] border p-4"
                    style={{ borderColor: '#4A1A2D', background: 'rgba(18,18,20,0.58)' }}
                  >
                    <div className="flex items-center gap-3">
                      <DialledMark size={26} />
                      <div>
                        <p className="text-sm font-bold" style={{ color: COLORS.text }}>
                          Signed-off palette applied
                        </p>
                        <p className="text-sm" style={{ color: '#C8C8D8' }}>
                          Magenta actions, anthracite surfaces, white mark details.
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6" style={{ color: COLORS.muted }}>
                      Replace this panel with captured app footage once the walkthrough is ready.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            <StatCard label="Brand Core" value="Magenta + Anthracite" note="Yellow retired from the signed-off system." />
            <StatCard label="Commercial Model" value="Free + Premium" note="Premium unlocks maintenance tracker and AI Advisor." />
            <StatCard label="Platform Surface" value="Android + iOS" note="Updated legal copy now reflects both app targets." />
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <div className="card overflow-hidden border-0 p-0 shadow-none">
          <div
            className="h-full rounded-[24px] border p-6 md:p-8"
            style={{ borderColor: '#E7E7EB', background: '#FFFFFF' }}
          >
            <p className="text-[11px] font-black uppercase tracking-[0.24em]" style={{ color: COLORS.accent }}>
              Feature Surface
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-[20px] border p-5"
                  style={{ borderColor: '#E7E7EB', background: '#FBFBFD' }}
                >
                  <h3 className="text-sm font-black uppercase tracking-[0.16em]" style={{ color: COLORS.accent }}>
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-neutral-700">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card overflow-hidden border-0 p-0 shadow-none">
          <div
            className="h-full rounded-[24px] border p-6 md:p-8"
            style={{ borderColor: COLORS.border, background: COLORS.surface, color: COLORS.text }}
          >
            <p className="text-[11px] font-black uppercase tracking-[0.24em]" style={{ color: COLORS.accent }}>
              Current Scope
            </p>
            <ul className="mt-5 space-y-4">
              {scope.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6" style={{ color: '#C8C8D8' }}>
                  <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full" style={{ background: COLORS.accent }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div
              className="mt-6 rounded-[20px] border p-5"
              style={{ borderColor: '#4A1A2D', background: COLORS.accentDim }}
            >
              <p className="text-[11px] font-black uppercase tracking-[0.22em]" style={{ color: COLORS.accent }}>
                Policy Routes
              </p>
              <p className="mt-3 text-sm leading-6" style={{ color: '#C8C8D8' }}>
                The privacy policy and terms pages now render the latest supplied source HTML rather
                than older embedded copies, so future legal text swaps stay exact.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <SecondaryLink href="/apps/dialled-mtb/privacy-policy">Open Privacy</SecondaryLink>
                <SecondaryLink href="/apps/dialled-mtb/terms-of-use">Open Terms</SecondaryLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Badge({ children }) {
  return (
    <span
      className="rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em]"
      style={{ borderColor: COLORS.border, background: COLORS.surface, color: COLORS.muted }}
    >
      {children}
    </span>
  );
}

function PrimaryLink({ href, children }) {
  return (
    <Link
      href={href}
      className="rounded-full border px-5 py-3 text-sm font-black uppercase tracking-[0.14em] transition-colors"
      style={{ borderColor: COLORS.accent, background: COLORS.accent, color: '#FFFFFF' }}
    >
      {children}
    </Link>
  );
}

function SecondaryLink({ href, children }) {
  return (
    <Link
      href={href}
      className="rounded-full border px-5 py-3 text-sm font-black uppercase tracking-[0.14em] transition-colors"
      style={{ borderColor: COLORS.border, background: 'transparent', color: COLORS.text }}
    >
      {children}
    </Link>
  );
}

function StatCard({ label, value, note }) {
  return (
    <div
      className="rounded-[20px] border p-5"
      style={{ borderColor: COLORS.border, background: COLORS.surface, color: COLORS.text }}
    >
      <p className="text-[11px] font-black uppercase tracking-[0.22em]" style={{ color: COLORS.muted }}>
        {label}
      </p>
      <p className="mt-2 text-lg font-black" style={{ color: COLORS.accent }}>
        {value}
      </p>
      <p className="mt-2 text-sm leading-6" style={{ color: '#C8C8D8' }}>
        {note}
      </p>
    </div>
  );
}

function DialledMark({ size = 60 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" aria-hidden="true">
      <polygon points="30,7 54,51 6,51" stroke="#E8ECF0" strokeWidth="2.2" fill="none" strokeLinejoin="round" />
      <polygon points="30,20 42,42 18,42" fill="#E8196E" opacity="0.95" />
      <circle cx="30" cy="7" r="2.5" fill="#E8ECF0" />
    </svg>
  );
}
