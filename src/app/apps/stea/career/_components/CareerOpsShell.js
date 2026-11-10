'use client';

import { useTenant } from '@/contexts/TenantContext';
import SteaAppsDropdown from '@/components/SteaAppsDropdown';
import TenantSwitcher from '@/components/TenantSwitcher';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

/* Career Ops shell — arcturusdc editorial system (D-SITE-088): ink on cream,
   mono microlabels, hard borders, no rounded cards or drop shadows. */
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
    <div className="w-screen -ml-[calc(50vw-50%)] bg-[#ece6d8] text-[#1c1c1a]">
      <div className="relative isolate overflow-hidden border-b-2 border-[#1c1c1a]">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(28,28,26,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(28,28,26,0.07)_1px,transparent_1px)] bg-[size:72px_72px]" />
        <header className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1c1c1a]/50 pb-4 font-mono text-xs uppercase tracking-[0.14em]">
            <span>
              /Career Ops{currentTenant ? ` · ${currentTenant.name}` : ''}
            </span>
            <div className="flex flex-wrap items-center gap-2 normal-case tracking-normal">
              <SteaAppsDropdown />
              <TenantSwitcher />
              <button
                onClick={handleSignOut}
                className="border border-[#1c1c1a] px-3 py-2 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#1c1c1a] transition-colors hover:bg-[#1c1c1a] hover:text-[#ece6d8]"
              >
                Sign out
              </button>
            </div>
          </div>

          <div className="mt-7 grid items-end gap-6 lg:grid-cols-[1.4fr_0.6fr]">
            <div>
              <p className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-[#f0452f]">
                /Honest job-search triage
              </p>
              <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-tight sm:text-7xl">
                {title}
                <span className="text-[#f0452f]">.</span>
              </h1>
            </div>
            <div className="border-l-2 border-[#f0452f] pl-5">
              <p className="text-sm leading-6 text-[#1c1c1a]/70 sm:text-base sm:leading-7">{subtitle}</p>
            </div>
          </div>
        </header>
      </div>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">{children}</section>
    </div>
  );
}
