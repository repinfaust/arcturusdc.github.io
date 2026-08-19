'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTenant } from '@/contexts/TenantContext';
import { getSteaAppForPath, isSteaAppAllowed } from '@/lib/steaAppCatalog';
import TenantSwitcher from '@/components/TenantSwitcher';

export default function SteaAppAccessGate({ children }) {
  const pathname = usePathname();
  const { currentTenant, loading, isSuperAdmin, userEmail } = useTenant();
  const app = getSteaAppForPath(pathname);

  if (!app || app.publicAccess) return children;

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-sm text-neutral-500">Checking app access…</div>;
  }

  const allowed = isSteaAppAllowed({
    appKey: app.key,
    tenant: currentTenant,
    userEmail,
    isSuperAdmin,
  });

  if (allowed) return children;

  return (
    <main className="mx-auto flex min-h-[65vh] max-w-2xl items-center px-4 py-16">
      <section className="w-full rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-pink-600">Workspace app access</p>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">{app.name} is not available here</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          This app is not assigned to {currentTenant?.name || 'the selected workspace'}. Choose another workspace or ask a workspace admin to update its app shelf.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <TenantSwitcher />
          <Link href="/apps/stea" className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
            Back to STEa
          </Link>
        </div>
      </section>
    </main>
  );
}
