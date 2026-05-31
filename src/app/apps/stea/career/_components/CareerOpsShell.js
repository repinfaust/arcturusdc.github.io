'use client';

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
    <div className="max-w-[1160px] mx-auto my-4 sm:my-6 p-4 sm:p-6 rounded-2xl" style={{ background: TOKENS.surface, boxShadow: '0 26px 86px rgba(0,20,50,0.18)' }}>
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] tracking-[0.1em] uppercase font-bold mb-2" style={{ color: TOKENS.secondary }}>
            Career Ops {currentTenant ? `| ${currentTenant.name}` : ''}
          </div>
          <h1 className="text-3xl sm:text-5xl leading-tight" style={{ margin: '6px 0 0', color: TOKENS.primary, fontFamily: 'var(--font-controlui-display)' }}>
            {title}
          </h1>
          <p className="text-sm sm:text-[17px] mt-2 max-w-[860px]" style={{ color: TOKENS.textSoft }}>{subtitle}</p>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-3 shrink-0 w-full sm:w-auto">
          <div className="flex flex-wrap items-center gap-2">
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

      {/* Tab navigation is handled inside the page (in-page state), so no nav here.
          The previous <Link> nav pointed at /cvs /config /history routes that
          don't exist and produced 404 prefetches. */}
      <section className="mt-6">{children}</section>
    </div>
  );
}
