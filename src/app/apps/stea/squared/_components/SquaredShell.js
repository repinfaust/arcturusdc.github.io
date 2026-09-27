'use client';

import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useTenant } from '@/contexts/TenantContext';
import SteaAppsDropdown from '@/components/SteaAppsDropdown';
import TenantSwitcher from '@/components/TenantSwitcher';
import { auth } from '@/lib/firebase';
import { Kicker } from './ui';

export default function SquaredShell({ children }) {
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
    <div className="bg-[#ede5d4] px-3 sm:px-4 py-6 font-[family-name:var(--font-sq-sans)] text-[#22251f] antialiased">
      <div className="max-w-[1160px] ml-0 mr-[6px] sm:mx-auto p-4 sm:p-7 bg-[#f8f4ea] border border-[#2f3828] shadow-[6px_6px_0_#4c5c3f] sm:shadow-[12px_12px_0_#4c5c3f]">
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex-1 min-w-0">
            <Kicker>Squared{currentTenant ? ` | ${currentTenant.name}` : ''} · Service leavers</Kicker>
            <h1 className="mt-2.5 font-[family-name:var(--font-sq-display)] [font-stretch:88%] text-[48px] sm:text-[72px] leading-[0.92] font-black tracking-[-0.035em] uppercase">
              Squared<span className="text-[#4c5c3f]">.</span>
            </h1>
            <p className="mt-3.5 text-[15px] sm:text-[17px] leading-relaxed max-w-[720px] text-[#686c62]">
              Honest job-search triage for life after service — find roles that genuinely fit, get a straight assessment, and skip the application grind.
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <SteaAppsDropdown />
              <TenantSwitcher />
              <button onClick={handleSignOut}
                className="bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors">
                Sign out
              </button>
            </div>
            {currentTenant && (
              <div className="bg-white rounded-xl px-3 py-2 border border-[#D6E0F4] sm:text-right">
                <div className="text-xs sm:text-[11px] text-[#94A3B8] font-bold uppercase">Workspace</div>
                <div className="text-sm font-bold text-[#10294D]">{currentTenant.name}</div>
              </div>
            )}
          </div>
        </header>

        <section className="mt-7">{children}</section>
      </div>
    </div>
  );
}
