'use client';

import Link from 'next/link';
import { useTenant } from '@/contexts/TenantContext';
import SteaAppsDropdown from '@/components/SteaAppsDropdown';
import TenantSwitcher from '@/components/TenantSwitcher';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

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
  { href: '/apps/stea/career', label: 'Live Pipeline' },
  { href: '/apps/stea/career/cvs', label: 'CV Tailoring' },
  { href: '/apps/stea/career/config', label: 'Config & Personalisation' },
  { href: '/apps/stea/career/history', label: 'History' },
];

export default function CareerOpsShell({ activeTab, title, subtitle, children }) {
  const { currentTenant } = useTenant();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      await signOut(auth);
      router.push('/apps/stea');
    } catch (err) {
      console.error('Sign out failed', err);
    }
  };

  return (
    <div style={{ maxWidth: 1160, margin: '24px auto', background: TOKENS.surface, borderRadius: 22, padding: 24, boxShadow: '0 26px 86px rgba(0,20,50,0.18)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ color: TOKENS.secondary, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
              Career Ops {currentTenant ? `| ${currentTenant.name}` : ''}
            </div>
          </div>
          <h1 style={{ margin: '6px 0 0', color: TOKENS.primary, fontFamily: 'var(--font-controlui-display)', fontSize: 54, lineHeight: '56px' }}>
            {title}
          </h1>
          <p style={{ margin: '8px 0 0', color: TOKENS.textSoft, fontSize: 17, maxWidth: 860 }}>{subtitle}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SteaAppsDropdown />
            <TenantSwitcher />
            <button
              onClick={handleSignOut}
              style={{
                background: '#3B82F6',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#2563EB'}
              onMouseOut={(e) => e.currentTarget.style.background = '#3B82F6'}
            >
              Sign out
            </button>
          </div>
          
          {currentTenant && (
            <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '8px 12px', border: '1px solid #D6E0F4', textAlign: 'right', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Workspace</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#10294D' }}>{currentTenant.name}</div>
              </div>
            </div>
          )}
        </div>
      </header>

      <nav style={{ marginTop: 24, background: TOKENS.surfaceLow, borderRadius: 14, padding: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              textDecoration: 'none',
              borderRadius: 10,
              padding: '9px 16px',
              background: activeTab === tab.href ? TOKENS.surfaceCard : 'transparent',
              color: activeTab === tab.href ? TOKENS.primary : TOKENS.textSoft,
              fontSize: 14,
              fontWeight: activeTab === tab.href ? 700 : 500,
              transition: 'all 0.2s ease',
            }}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <section style={{ marginTop: 24 }}>{children}</section>
    </div>
  );
}
