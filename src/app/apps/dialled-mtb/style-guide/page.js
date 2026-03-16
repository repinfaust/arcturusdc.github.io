import Link from 'next/link';

const COLORS = {
  bg: '#1A1C1E',
  surface: '#22262A',
  surface2: '#2A2E34',
  border: '#333840',
  text: '#E8ECF0',
  muted: '#6A7680',
  pink: '#F72585',
  white: '#E8ECF0',
  red: '#EF4444',
  amber: '#F59E0B',
  blue: '#60A5FA',
  slate: '#6A7680',
};

const palette = [
  {
    role: 'Primary · Brand Identity',
    roleColor: COLORS.pink,
    name: 'Magenta',
    hex: '#F72585',
    gradient: 'linear-gradient(135deg, #C4006A, #F72585)',
    desc: 'The brand colour. Used on the logo, identity marks, and brand highlights. Distinctive in the MTB app space and calibrated for dark surfaces.',
    uses: ['Wordmark', 'App icon', 'Triangle mark', 'Brand highlights', 'Splash screen'],
  },
  {
    role: 'Secondary · Functional UI & Actions',
    roleColor: COLORS.pink,
    name: 'Magenta (Action)',
    hex: '#F72585 — action tint',
    gradient: 'linear-gradient(135deg, #8A0042, #F72585)',
    desc: 'Magenta serves double duty as brand identity and primary action colour. Buttons, CTAs, active tab states, and due-task badges all use #F72585. Acid yellow has been removed per client direction.',
    uses: ['Primary buttons', 'Due task badges', 'Active tab', 'CTAs', 'Alert counts'],
  },
];

const supportingColors = [
  ['Anthracite', '#1A1C1E', 'Named secondary colour of the brand. App background and the surface that makes magenta pop.'],
  ['Surface', '#22262A', 'Cards, modals, and bottom sheets.'],
  ['Red', '#EF4444', 'Critical maintenance tasks only. Overdue and safety-critical alerts.'],
  ['Amber', '#F59E0B', 'High priority tasks. Coming-due-soon states.'],
  ['Blue', '#60A5FA', 'Medium priority and informational states.'],
  ['Slate', '#6A7680', 'Low priority tasks, secondary text, and MTB subtitle.'],
];

const usageRules = [
  ['Wordmark (DIALLED)', COLORS.pink, 'Magenta', 'Always on anthracite or dark background only.'],
  ['App icon (D-mark)', COLORS.pink, 'Magenta', 'Anthracite background. Small white accent dot in notch corner.'],
  ['Triangle mark', COLORS.pink, 'Magenta', 'Standalone icon use. Loading screen, ride complete badges.'],
  ['Primary buttons (CTAs)', COLORS.pink, 'Magenta', 'White (#E8ECF0) label text on magenta fill.'],
  ['Due task count badges', COLORS.pink, 'Magenta', 'Replaces red for non-critical due counts. Red reserved for Critical priority only.'],
  ['Active tab indicator', COLORS.pink, 'Magenta', 'Bottom nav active state. Inactive tabs in Slate.'],
  ['Notification icon', '#FFFFFF', 'White', 'Android system requirement. White silhouette only on transparent.'],
  ['Maintenance priority — Critical', COLORS.red, 'Red', 'Brake pads, frame inspection. Persistent banner treatment.'],
  ['Maintenance priority — High', COLORS.amber, 'Amber', 'Suspension, bearings, bolts.'],
  ['Maintenance priority — Medium', COLORS.blue, 'Blue', 'Drivetrain, tyres, rotors.'],
  ['Maintenance priority — Low', COLORS.slate, 'Slate', 'Cables, routing, chainring.'],
];

const donts = [
  ['no', "Don't use off-brand accent colours", 'The palette is magenta + anthracite only. No yellow, no blue, no green accents. Priority colours are the only exception and are used for maintenance task states exclusively.'],
  ['yes', 'Do use magenta for all primary actions', 'Buttons, CTAs, active tab states, due badges, and AI Advisor accents all use #F72585. White text on magenta. Anthracite for all backgrounds and surfaces.'],
  ['no', "Don't use magenta on light backgrounds", 'Magenta is calibrated for dark and anthracite surfaces only.'],
  ['yes', 'Do use the triangle as a UI motif', 'The triangle reads as mountain peak, trail sign, and warning marker.'],
  ['no', "Don't use dark text on magenta fills", 'Always use white (#E8ECF0) as label text on magenta buttons and badges, not anthracite.'],
  ['yes', 'Do keep red for Critical tasks only', 'Red is reserved for Critical priority maintenance so the urgency signal stays strong.'],
];

const competitive = [
  ['Strava', 'Orange', 'Social ride tracking'],
  ['Trailforks', 'Blue', 'Trail maps'],
  ['Komoot', 'Orange', 'Route planning'],
  ['Garmin Connect', 'Blue', 'Device sync / analytics'],
  ['Dialled MTB', 'Magenta + Anthracite', 'Maintenance tracking — colour space unoccupied'],
];

export const metadata = {
  title: 'Dialled MTB Style Guide — Arcturus Digital Consulting',
  description: 'Client sign-off page for the Dialled MTB style guide.',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function DialledStyleGuidePage() {
  return (
    <main className="min-h-screen bg-[#1A1C1E] text-[#E8ECF0] pb-16">
      <header className="border-b border-[#333840] bg-[#22262A]">
        <div className="mx-auto max-w-6xl px-6 py-10 md:px-8 md:py-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-4">
            <TriangleMark />
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-[0.04em] text-[#F72585]">DIALLED MTB</h1>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#6A7680]">Brand Colour System and Usage Guide</p>
            </div>
          </div>
          <div className="text-sm leading-7 text-[#6A7680] md:text-right">
            <p>Version 1.3 · March 2026</p>
            <p>Prepared by Arcturus Digital Consulting</p>
            <p>For: E D Grant · Dialled MTB</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
          <Link href="/apps/dialled-mtb" className="rounded-full border border-[#333840] bg-[#22262A] px-4 py-2 text-[#E8ECF0] hover:border-[#F72585] hover:text-[#F72585]">
            Back to Dialled MTB
          </Link>
          <span className="rounded-full border border-[#333840] bg-[#1A1C1E] px-4 py-2 text-[#6A7680]">Client review page</span>
          <span className="rounded-full border border-[#333840] bg-[#1A1C1E] px-4 py-2 text-[#6A7680]">Noindex</span>
        </div>

        <Section label="01 · Colour Palette">
          <div className="grid gap-4 md:grid-cols-2">
            {palette.map((item) => (
              <div key={item.name} className="overflow-hidden rounded-2xl border border-[#333840] bg-[#22262A]">
                <div className="h-28 px-5 py-4 flex items-end" style={{ background: item.gradient }}>
                  <span className="font-mono text-xs font-bold tracking-[0.08em]" style={{ color: '#FFFFFF' }}>
                    {item.hex}
                  </span>
                </div>
                <div className="p-5">
                  <p className="text-xs uppercase tracking-[0.18em]" style={{ color: item.roleColor }}>{item.role}</p>
                  <h2 className="mt-2 text-2xl font-bold">{item.name}</h2>
                  <p className="mt-3 text-sm leading-6 text-[#6A7680]">{item.desc}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.uses.map((use) => (
                      <span key={use} className="rounded-md border border-[#333840] px-3 py-1 text-xs text-[#6A7680]">{use}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section label="02 · Supporting Colours">
          <DataTable
            headers={['Colour', 'Hex', 'Role']}
            rows={supportingColors.map(([name, hex, role]) => [
              <div key={name} className="flex items-center gap-3">
                <span className="inline-block h-3 w-3 rounded-sm border border-[#444]" style={{ background: hex }} />
                <span className="font-semibold">{name}</span>
              </div>,
              <code key={`${name}-hex`}>{hex}</code>,
              <span key={`${name}-role`} className="text-[#6A7680]">{role}</span>,
            ])}
          />
        </Section>

        <Section label="03 · Usage Rules by UI Element">
          <DataTable
            headers={['Element', 'Colour', 'Notes']}
            rows={usageRules.map(([element, swatch, label, notes]) => [
              <span key={element} className="font-semibold">{element}</span>,
              <div key={`${element}-color`} className="flex items-center gap-3">
                <span className="inline-block h-3 w-3 rounded-full border border-[#555]" style={{ background: swatch }} />
                <span>{label}</span>
              </div>,
              <span key={`${element}-notes`} className="text-[#6A7680]">{notes}</span>,
            ])}
          />
        </Section>

        <Section label="04 · Brand Marks">
          <div className="grid gap-4 md:grid-cols-3">
            <MarkCard
              title="Triangle Mark"
              badge="PRIMARY ICON"
              badgeColor={COLORS.white}
              desc="The confirmed app icon. Reads instantly as mountain peak, trail sign, and terrain marker. White summit dot. Clean on anthracite at all sizes."
            >
              <TriangleMark large />
            </MarkCard>
            <MarkCard
              title="D-Mark"
              badge="SECONDARY"
              badgeColor={COLORS.muted}
              desc="Secondary mark using the client's D-form with spine gap. Magenta fill, white accent dot in notch. Use in wordmark context, widgets, and in-app UI."
            >
              <DMark />
            </MarkCard>
            <MarkCard
              title="Wordmark"
              desc="Full magenta wordmark. Dark backgrounds only. The split D-pink/IALLED-yellow treatment is retired in favour of a cleaner single-colour read."
            >
              <div className="text-center text-4xl font-black tracking-tight text-[#F72585] md:text-5xl">DIALLED</div>
            </MarkCard>
          </div>
        </Section>

        <Section label="05 · Do and Don't">
          <div className="grid gap-3 md:grid-cols-2">
            {donts.map(([kind, title, desc]) => (
              <div key={title} className="flex gap-3 rounded-xl border border-[#333840] bg-[#22262A] p-4">
                <div
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ background: kind === 'yes' ? '#1a2a1a' : '#3a1a1a', color: kind === 'yes' ? '#34D399' : '#EF4444' }}
                >
                  {kind === 'yes' ? 'Y' : 'N'}
                </div>
                <div>
                  <div className="font-semibold">{title}</div>
                  <p className="mt-1 text-sm leading-6 text-[#6A7680]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section label="06 · Competitive Context">
          <DataTable
            headers={['App', 'Primary Colour', 'Position']}
            rows={competitive.map(([app, color, position]) => [
              <strong key={app}>{app}</strong>,
              <span key={`${app}-color`} style={app === 'Dialled MTB' ? { color: COLORS.pink, fontWeight: 700 } : undefined}>{color}</span>,
              <span key={`${app}-position`} className="text-[#E8ECF0]">{position}</span>,
            ])}
          />
          <p className="mt-4 text-sm leading-6 text-[#6A7680]">
            No major MTB app owns magenta. Combined with a distinct maintenance-focused proposition, this colour system has genuine differentiation potential.
          </p>
        </Section>

        <Section label="07 · Confirmed Palette">
          <p className="mb-5 text-sm text-[#6A7680]">Palette locked by client. Two colours only: <code>#F72585</code> magenta and <code>#1A1C1E</code> anthracite. Acid yellow has been removed from the system.</p>
          <DataTable
            headers={['Option', 'Hex', 'Character', 'Status']}
            rows={[
              [
                <div key="retired" className="flex items-center gap-3">
                  <span className="inline-block h-3 w-3 rounded-sm" style={{ background: COLORS.pink }} />
                  <strong>Current (client&apos;s value)</strong>
                </div>,
                <code key="retired-hex">#F72585</code>,
                <span key="retired-char" className="text-[#6A7680]">Deeper magenta, closer to raspberry. More grounded.</span>,
                <span key="retired-status" className="text-[#6A7680]">Retired</span>,
              ],
              [
                <div key="confirmed" className="flex items-center gap-3">
                  <span className="inline-block h-3 w-3 rounded-sm" style={{ background: COLORS.pink }} />
                  <strong>Brighter option</strong>
                </div>,
                <code key="confirmed-hex">#F72585</code>,
                <span key="confirmed-char" className="text-[#6A7680]">Electric fuchsia. More visible on OLED. Stronger contrast at small icon sizes.</span>,
                <span key="confirmed-status" className="font-semibold text-[#E8ECF0]">Confirmed</span>,
              ],
            ]}
          />
          <p className="mt-4 text-sm leading-6 text-[#6A7680]">
            The confirmed palette should be reused consistently across the app icon, wordmark, brand documents, and developer colour tokens.
          </p>
        </Section>
      </div>

      <footer className="mt-16 border-t border-[#333840] px-6 py-6 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm text-[#6A7680] md:flex-row md:items-center md:justify-between">
          <p>Dialled MTB Brand Colour System v1.3 · Yellow removed per client direction · Palette locked: #F72585 magenta + #1A1C1E anthracite · Magenta = primary action colour</p>
          <p>Arcturus Digital Consulting</p>
        </div>
      </footer>
    </main>
  );
}

function Section({ label, children }) {
  return (
    <section className="mt-14">
      <p className="mb-5 border-b border-[#333840] pb-2 text-[10px] uppercase tracking-[0.22em] text-[#6A7680]">{label}</p>
      {children}
    </section>
  );
}

function DataTable({ headers, rows }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#333840]">
      <table className="w-full border-collapse">
        <thead className="bg-[#1A1C1E]">
          <tr>
            {headers.map((header) => (
              <th key={header} className="border-b border-[#333840] px-4 py-3 text-left text-[11px] uppercase tracking-[0.14em] text-[#6A7680]">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-[#22262A]' : 'bg-[#1A1C1E]'}>
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="border-b border-[#333840] px-4 py-3 align-top text-sm">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MarkCard({ title, badge, badgeColor, desc, children }) {
  return (
    <div className="rounded-2xl border border-[#333840] bg-[#22262A] p-6 text-center">
      <div className="mb-4 flex min-h-[120px] items-center justify-center rounded-xl bg-[#1A1C1E]">
        {children}
      </div>
      <p className="font-bold">
        {title}{' '}
        {badge ? <span className="ml-1 text-[11px] font-bold tracking-[0.1em]" style={{ color: badgeColor }}>{badge}</span> : null}
      </p>
      <p className="mt-2 text-sm leading-6 text-[#6A7680]">{desc}</p>
    </div>
  );
}

function TriangleMark({ large = false }) {
  return (
    <svg width={large ? 92 : 44} height={large ? 92 : 44} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <rect width="100" height="100" rx="18" fill="#22262A" />
      <polygon points="50,12 88,82 12,82" stroke="#F72585" strokeWidth="7" fill="none" strokeLinejoin="round" />
      <polygon points="50,36 68,70 32,70" fill="#F72585" opacity="0.85" />
      <circle cx="50" cy="12" r="5" fill="#E8ECF0" />
    </svg>
  );
}

function DMark() {
  return (
    <svg width="92" height="92" viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <rect width="100" height="100" rx="18" fill="#22262A" />
      <path d="M14,10 L54,10 Q90,10 90,50 Q90,90 54,90 L14,90 L14,26 Z" fill="#F72585" />
      <path d="M32,26 L52,26 Q74,26 74,50 Q74,74 52,74 L32,74 Z" fill="#22262A" />
      <rect x="14" y="43" width="19" height="10" fill="#22262A" />
      <polygon points="14,10 28,10 14,24" fill="#22262A" />
      <circle cx="19" cy="15" r="5" fill="#E8ECF0" />
    </svg>
  );
}
