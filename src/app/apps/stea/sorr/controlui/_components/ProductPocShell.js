import Link from 'next/link';

const TOKENS = {
  surface: '#F8F9FF',
  surfaceLow: '#EFF4FF',
  surfaceCard: '#FFFFFF',
  text: '#0B1C30',
  textSoft: '#4C5D74',
  primary: '#001432',
  primaryContainer: '#10294D',
  secondary: '#006C50',
  secondarySoft: '#53FDC7',
};

const TABS = [
  { href: '/apps/stea/sorr/controlui', label: 'Overview' },
  { href: '/apps/stea/sorr/controlui/handoff', label: 'Claude Handoff States' },
  { href: '/apps/stea/sorr/controlui/use-cases', label: 'Governed Use Cases' },
  { href: '/apps/stea/sorr/controlui/implementation', label: 'Implementation' },
  { href: '/apps/stea/sorr/controlui/fulfilment-loop', label: 'Fulfilment Loop' },
  { href: '/apps/stea/sorr/controlui/poc-analysis', label: 'POC Analysis' },
  { href: '/apps/stea/sorr/controlui/admin-preview', label: 'Admin Console Preview' },
];

export default function ProductPocShell({ activeTab, title, subtitle, children }) {
  return (
    <div style={{ maxWidth: 1160, margin: '24px auto', background: TOKENS.surface, borderRadius: 22, padding: 24, boxShadow: '0 26px 86px rgba(0,20,50,0.18)' }}>
      <header>
        <div>
          <div style={{ color: TOKENS.secondary, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
            SoRR Control Product POC
          </div>
          <h1 style={{ margin: '6px 0 0', color: TOKENS.primary, fontFamily: 'var(--font-controlui-display)', fontSize: 54, lineHeight: '56px' }}>
            {title}
          </h1>
          <p style={{ margin: '8px 0 0', color: TOKENS.textSoft, fontSize: 17, maxWidth: 860 }}>{subtitle}</p>
          <p style={{ margin: '8px 0 0', color: TOKENS.primaryContainer, fontSize: 14, fontWeight: 600 }}>
            SoRR does not replace Claude - it enables it to operate safely inside your business.
          </p>
        </div>
      </header>

      <nav style={{ marginTop: 16, background: TOKENS.surfaceLow, borderRadius: 14, padding: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              textDecoration: 'none',
              borderRadius: 10,
              padding: '9px 12px',
              background: activeTab === tab.href ? TOKENS.surfaceCard : 'transparent',
              color: activeTab === tab.href ? TOKENS.primary : TOKENS.textSoft,
              fontSize: 13,
              fontWeight: activeTab === tab.href ? 700 : 500,
            }}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <section style={{ marginTop: 16 }}>{children}</section>
    </div>
  );
}
