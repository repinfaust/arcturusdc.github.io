'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTenant } from '@/contexts/TenantContext';
import { isSteaAppAllowed, STEA_APP_CATALOG } from '@/lib/steaAppCatalog';

const APP_ICONS = {
  harls: '🔍',
  autoproduct: '✦',
  filo: '📊',
  hans: '🧪',
  ruby: '📕',
  'automated-tests': '✓',
  'explore-stea': '◫',
  'orbit-poc': '◎',
  'orbit-ai-act': '◇',
  'art-atlas': '✧',
  wc26: '⚽',
  'rider-management': '△',
  'dialled-mtb-promo': '↗',
  'dialled-mtb-calendar': '□',
  sidestand: '▸',
};

const STEA_APPS = [
  { name: 'STEa Home', path: '/apps/stea', icon: '🏠', color: 'text-neutral-700' },
  ...STEA_APP_CATALOG.map((app) => ({
    name: app.name,
    path: app.paths[0],
    appKey: app.key,
    icon: APP_ICONS[app.key] || '•',
    color: 'text-neutral-800',
    description: app.description,
  })),
  { name: 'Admin', path: '/apps/stea/admin', adminOnly: true, icon: '⚙️', color: 'text-gray-600', description: 'Settings' },
];

export default function SteaAppsDropdown() {
  const [showAppsMenu, setShowAppsMenu] = useState(false);
  const { currentTenant, isSuperAdmin, isWorkspaceAdmin, userEmail } = useTenant();
  const visibleApps = STEA_APPS.filter((app) => {
    if (app.adminOnly) return isSuperAdmin || isWorkspaceAdmin;
    // The selected workspace controls the visible shelf even for super admins;
    // their global role still permits direct administrative access when needed.
    return isSteaAppAllowed({ appKey: app.appKey, tenant: currentTenant, userEmail, isSuperAdmin: false });
  });

  return (
    <div className="relative">
      <button
        onClick={() => setShowAppsMenu(!showAppsMenu)}
        className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
      >
        <span>STEa Apps</span>
        <svg
          className={`h-4 w-4 transition-transform ${showAppsMenu ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showAppsMenu && (
        <>
          {/* Backdrop to close dropdown */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setShowAppsMenu(false)}
          />
          {/* Dropdown menu with very high z-index to appear above TLDraw */}
          <div className="absolute left-0 top-full z-[9999] mt-2 max-h-[70vh] w-72 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-xl">
            <div className="p-2">
              {visibleApps.map((app) => (
                <Link
                  key={app.path}
                  href={app.path}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition hover:bg-neutral-50"
                  onClick={() => setShowAppsMenu(false)}
                >
                  <span className="text-2xl">{app.icon}</span>
                  <div className="flex-1">
                    <div className={`font-medium ${app.color}`}>{app.name}</div>
                    {app.description && (
                      <div className="text-xs text-neutral-500">{app.description}</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
