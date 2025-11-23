'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useTenant } from '@/contexts/TenantContext';

const APEXTWIN_TENANT_ID = 'DL7ScScEhvAcFpAmmS8h';

const NAV_ITEMS = [
  { href: '/apps/stea/apextwin-poc', label: 'Home', mobileLabel: 'Home', icon: '◇', exact: true },
  { href: '/apps/stea/apextwin-poc/events', label: 'Events', mobileLabel: 'Events', icon: '◈' },
  { href: '/apps/stea/apextwin-poc/garage', label: 'Garage', mobileLabel: 'Garage', icon: '⟁' },
  { href: '/apps/stea/apextwin-poc/rider', label: 'Rider', mobileLabel: 'Rider', icon: '⬡' },
];

export default function ApexTwinLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentTenant, loading: tenantLoading } = useTenant();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const isActive = (item) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Redirect if not authenticated or not in the ApexTwin tenant
  useEffect(() => {
    if (authLoading || tenantLoading) return;

    if (!user) {
      router.replace('/apps/stea?next=/apps/stea/apextwin-poc');
      return;
    }

    if (currentTenant?.id !== APEXTWIN_TENANT_ID) {
      router.replace('/apps/stea');
    }
  }, [user, authLoading, currentTenant, tenantLoading, router]);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      await signOut(auth);
      router.replace('/apps/stea');
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  if (authLoading || tenantLoading) {
    return (
      <div className="min-h-screen apex-bg apex-noise flex items-center justify-center">
        <div className="apex-panel px-6 py-4 text-apex-soft text-sm">
          Loading...
        </div>
      </div>
    );
  }

  if (!user || currentTenant?.id !== APEXTWIN_TENANT_ID) {
    return (
      <div className="min-h-screen apex-bg apex-noise flex items-center justify-center">
        <div className="apex-panel px-6 py-4 text-apex-soft text-sm">
          Checking access...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen apex-bg apex-noise">
      {/* Header - Sticky on mobile */}
      <header className="sticky top-0 z-50 bg-apex-carbon/95 backdrop-blur-sm border-b border-apex-stealth">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo / Brand */}
            <div className="flex items-center gap-4 sm:gap-6">
              <Link href="/apps/stea/apextwin-poc" className="flex items-center gap-2 sm:gap-3">
                <span className="text-apex-mint text-xl sm:text-2xl font-bold tracking-tighter">∆</span>
                <span className="text-apex-white font-semibold tracking-tight text-sm sm:text-base">ApexTwin</span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      isActive(item)
                        ? 'text-apex-mint bg-apex-mint/10'
                        : 'text-apex-soft hover:text-apex-white hover:bg-apex-graphite'
                    }`}
                  >
                    <span className={`mr-2 ${isActive(item) ? 'text-apex-mint' : 'text-apex-mint/60'}`}>{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* User / Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-xs text-apex-soft hidden sm:block truncate max-w-[120px]">
                {user.displayName || user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-xs text-apex-soft hover:text-apex-white transition-colors px-2 py-1"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation - Fixed at bottom */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-apex-carbon/95 backdrop-blur-sm border-t border-apex-stealth safe-area-pb">
        <div className="flex items-center justify-around py-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors min-w-[64px] ${
                isActive(item)
                  ? 'text-apex-mint'
                  : 'text-apex-soft'
              }`}
            >
              <span className={`text-lg ${isActive(item) ? 'text-apex-mint' : 'text-apex-mint/40'}`}>{item.icon}</span>
              <span className="text-[10px] font-medium">{item.mobileLabel}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Content - Add bottom padding on mobile for fixed nav */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-8">
        {children}
      </main>
    </div>
  );
}
