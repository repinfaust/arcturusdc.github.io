'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useTenant } from '@/contexts/TenantContext';

const APEXTWIN_TENANT_ID = 'DL7ScScEhvAcFpAmmS8h';

const NAV_ITEMS = [
  { href: '/apps/stea/apextwin-poc', label: 'Dashboard', icon: '◇' },
  { href: '/apps/stea/apextwin-poc/bikes', label: 'Bikes', icon: '⟁' },
  { href: '/apps/stea/apextwin-poc/sessions', label: 'Sessions', icon: '◈' },
  { href: '/apps/stea/apextwin-poc/paddock', label: 'Paddock', icon: '⬡' },
];

export default function ApexTwinLayout({ children }) {
  const router = useRouter();
  const { currentTenant, loading: tenantLoading } = useTenant();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

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
      {/* Header */}
      <header className="border-b border-apex-stealth">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo / Brand */}
            <div className="flex items-center gap-6">
              <Link href="/apps/stea/apextwin-poc" className="flex items-center gap-3">
                <span className="text-apex-mint text-2xl font-bold tracking-tighter">∆</span>
                <span className="text-apex-white font-semibold tracking-tight">ApexTwin</span>
              </Link>

              {/* Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="px-3 py-2 text-sm text-apex-soft hover:text-apex-white hover:bg-apex-graphite rounded-lg transition-colors"
                  >
                    <span className="mr-2 text-apex-mint/60">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* User / Actions */}
            <div className="flex items-center gap-4">
              <span className="text-xs text-apex-soft hidden sm:block">
                {user.displayName || user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-xs text-apex-soft hover:text-apex-white transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden border-b border-apex-stealth overflow-x-auto">
        <nav className="flex items-center gap-1 px-4 py-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 text-sm text-apex-soft hover:text-apex-white hover:bg-apex-graphite rounded-lg transition-colors whitespace-nowrap"
            >
              <span className="mr-1 text-apex-mint/60">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
