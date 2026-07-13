'use client';

import Link from 'next/link';
import SteaAppsDropdown from '@/components/SteaAppsDropdown';

// Warm Sanctuary palette — from the HoL Yoga app's own design system
// (design/app-design-spec/tokens/colors.css in the holyoga repo), reused
// here so this admin surface reads as authentically HoL-branded rather than
// generic STEa chrome.
export const holColors = {
  cream50: '#fdfbf6',
  cream100: '#faf6ee',
  cream200: '#f4ecdf',
  cream300: '#eadfcc',
  plum900: '#241019',
  plum800: '#3a1c2b',
  plum500: '#6f4a5d',
  pink500: '#f4128c',
  pink600: '#c50e72',
  gold500: '#c4922e',
  gold100: '#f6ecd6',
};

function YantraMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="#c4122e" />
      <polygon points="24,8 36,32 12,32" fill="none" stroke="#e3c37c" strokeWidth="1.5" />
      <polygon points="24,40 12,16 36,16" fill="none" stroke="#e3c37c" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="4" fill="#e3c37c" />
    </svg>
  );
}

export function HolYogaHeader({ title, subtitle, onSignOut, breadcrumb }) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <SteaAppsDropdown />
        <div className="h-5 w-px" style={{ backgroundColor: holColors.cream300 }} />
        <Link href="/apps/stea/hol-yoga" className="flex items-center gap-2.5">
          <YantraMark size={30} />
        </Link>
        <div className="h-5 w-px" style={{ backgroundColor: holColors.cream300 }} />
        <div>
          {breadcrumb && (
            <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: holColors.gold500 }}>
              {breadcrumb}
            </p>
          )}
          <h1 className="text-xl font-semibold" style={{ color: holColors.plum800 }}>
            {title}
          </h1>
          {subtitle && <p className="text-sm" style={{ color: holColors.plum500 }}>{subtitle}</p>}
        </div>
      </div>
      {onSignOut && (
        <button
          onClick={onSignOut}
          className="rounded-lg border px-3 py-2 text-sm transition hover:opacity-80"
          style={{ borderColor: holColors.cream300, color: holColors.plum500 }}
        >
          Sign out
        </button>
      )}
    </div>
  );
}

export function HolYogaShell({ children }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: holColors.cream100 }}>
      <div className="mx-auto max-w-4xl px-4 py-12">{children}</div>
    </div>
  );
}

export function PrototypeBadge({ label = 'Prototype — not connected' }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
      style={{ backgroundColor: holColors.gold100, color: holColors.gold500 }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: holColors.gold500 }} />
      {label}
    </span>
  );
}
