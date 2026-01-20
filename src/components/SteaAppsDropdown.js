'use client';

import { useState } from 'react';
import Link from 'next/link';

const STEA_APPS = [
  { name: 'STEa Home', path: '/apps/stea', icon: '🏠', color: 'text-neutral-700' },
  { name: 'Filo', path: '/apps/stea/filo', icon: '📊', color: 'text-blue-600', description: 'Product Roadmap' },
  { name: 'Ruby', path: '/apps/stea/ruby', icon: '📕', color: 'text-rose-600', description: 'Documentation' },
  { name: 'Hans', path: '/apps/stea/hans', icon: '🧪', color: 'text-purple-600', description: 'Test Execution' },
  { name: 'Harls', path: '/apps/stea/harls', icon: '🔍', color: 'text-green-600', description: 'Test Cases' },
  { name: 'Admin', path: '/apps/stea/admin', icon: '⚙️', color: 'text-gray-600', description: 'Settings' },
];

export default function SteaAppsDropdown() {
  const [showAppsMenu, setShowAppsMenu] = useState(false);

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
          <div className="absolute left-0 top-full z-[9999] mt-2 w-64 rounded-lg border border-neutral-200 bg-white shadow-xl">
            <div className="p-2">
              {STEA_APPS.map((app) => (
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
