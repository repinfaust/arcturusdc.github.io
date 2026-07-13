'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useTenant } from '@/contexts/TenantContext';

// Mirrors the tenant-name gating pattern used by dialled-mtb's feedback/promo
// pages (ALLOWED_WORKSPACE_NAMES) rather than a hardcoded email allowlist —
// this is the one precedent in the codebase that actually supports access by
// tenant membership rather than Arcturus staff only.
const HOL_YOGA_TENANT_NAME = 'Heart of Living Yoga';

export function hasHolYogaAccess(tenant, isSuperAdmin) {
  if (isSuperAdmin) return true;
  const tenantName = tenant?.name?.trim().toLowerCase();
  return tenantName === HOL_YOGA_TENANT_NAME.toLowerCase();
}

export function useHolYogaAccess() {
  const router = useRouter();
  const { currentTenant, isSuperAdmin, loading: tenantLoading } = useTenant();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (!firebaseUser) router.replace('/apps/stea?next=/apps/stea/hol-yoga');
    });
    return () => unsub();
  }, [router]);

  const access = hasHolYogaAccess(currentTenant, isSuperAdmin);

  useEffect(() => {
    if (authReady && user && !tenantLoading && !access) {
      router.replace('/apps/stea');
    }
  }, [authReady, user, tenantLoading, access, router]);

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    await signOut(auth);
    router.replace('/apps/stea');
  };

  return {
    ready: authReady && !tenantLoading,
    user,
    hasAccess: access,
    handleSignOut,
  };
}
