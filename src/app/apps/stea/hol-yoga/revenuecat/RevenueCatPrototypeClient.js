'use client';

import { useState } from 'react';
import { useHolYogaAccess } from '../HolYogaAccessGate';
import { HolYogaHeader, HolYogaShell, PrototypeBadge, holColors } from '../HolYogaChrome';

// Illustrative only — not real supporters. Shaped to match the fields
// dialled-mtb's rider-lookup tool actually returns, so the eventual real
// build is a close swap-in rather than a redesign.
const DEMO_SUPPORTERS = [
  {
    email: 'jane.smith@example.com',
    displayName: 'Jane Smith',
    joined: '12 Mar 2026',
    plan: 'Monthly — £4.99/mo',
    status: 'active',
    nextRenewal: '12 Aug 2026',
  },
  {
    email: 'r.patel@example.com',
    displayName: 'Ravi Patel',
    joined: '2 Jan 2026',
    plan: 'Lifetime — £49.99',
    status: 'active',
    nextRenewal: null,
  },
  {
    email: 'wilson.family@example.com',
    displayName: 'The Wilson Family',
    joined: '28 Apr 2026',
    plan: 'Monthly — £4.99/mo',
    status: 'cancelled',
    nextRenewal: null,
  },
];

const DURATION_OPTIONS = [
  { value: 'monthly', label: '1 month' },
  { value: 'three_month', label: '3 months' },
  { value: 'six_month', label: '6 months' },
  { value: 'yearly', label: '1 year' },
  { value: 'lifetime', label: 'Lifetime' },
];

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border bg-white p-5" style={{ borderColor: holColors.cream300 }}>
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: holColors.gold500 }}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold" style={{ color: holColors.plum800 }}>
        {value}
      </p>
    </div>
  );
}

export default function RevenueCatPrototypeClient() {
  const { ready, hasAccess, handleSignOut } = useHolYogaAccess();
  const [email, setEmail] = useState('');
  const [selected, setSelected] = useState(null);
  const [searchDone, setSearchDone] = useState(false);
  const [duration, setDuration] = useState('monthly');
  const [grantMessage, setGrantMessage] = useState('');

  if (!ready) return null;
  if (!hasAccess) return null;

  const handleSearch = (e) => {
    e.preventDefault();
    setGrantMessage('');
    const match = DEMO_SUPPORTERS.find((s) => s.email.toLowerCase() === email.toLowerCase().trim());
    setSelected(match ?? null);
    setSearchDone(true);
  };

  const handleGrant = () => {
    if (!selected) return;
    const label = DURATION_OPTIONS.find((d) => d.value === duration)?.label ?? duration;
    setGrantMessage(`Prototype only — in the real tool, this would grant a ${label} trial to ${selected.email} via RevenueCat.`);
  };

  return (
    <HolYogaShell>
      <HolYogaHeader
        title="Supporter membership"
        subtitle="Look up supporters and manage trial access"
        breadcrumb="Heart of Living Yoga"
        onSignOut={handleSignOut}
      />

      <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border p-5" style={{ borderColor: holColors.cream300, backgroundColor: holColors.gold100 }}>
        <p className="text-sm" style={{ color: holColors.plum800 }}>
          This is a prototype. The names and figures below are illustrative — this page is not yet
          connected to RevenueCat or the app's real supporter data. Dialled MTB has a working
          version of this tool today; building the equivalent for Heart of Living Yoga is a
          separate piece of work once the app's membership is fully live.
        </p>
        <PrototypeBadge />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Active supporters" value="2" />
        <StatCard label="Monthly members" value="1" />
        <StatCard label="Lifetime members" value="1" />
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: holColors.cream300 }}>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide" style={{ color: holColors.gold500 }}>
          Find a supporter
        </h2>
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Try jane.smith@example.com"
            className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none"
            style={{ borderColor: holColors.cream300 }}
          />
          <button
            type="submit"
            className="rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            style={{ backgroundColor: holColors.pink500 }}
          >
            Search
          </button>
        </form>
        {searchDone && !selected && (
          <p className="mt-3 text-sm" style={{ color: holColors.plum500 }}>
            No supporter found for that email. Try jane.smith@example.com, r.patel@example.com, or
            wilson.family@example.com.
          </p>
        )}
      </div>

      {selected && (
        <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: holColors.cream300 }}>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide" style={{ color: holColors.gold500 }}>
            Supporter
          </h2>
          <div className="mb-6 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: holColors.plum500 }}>Name</p>
              <p className="mt-0.5" style={{ color: holColors.plum800 }}>{selected.displayName}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: holColors.plum500 }}>Email</p>
              <p className="mt-0.5" style={{ color: holColors.plum800 }}>{selected.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: holColors.plum500 }}>Plan</p>
              <p className="mt-0.5" style={{ color: holColors.plum800 }}>{selected.plan}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: holColors.plum500 }}>Status</p>
              <p className="mt-0.5 capitalize" style={{ color: selected.status === 'active' ? '#2d6e1c' : holColors.plum500 }}>
                {selected.status}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: holColors.plum500 }}>Member since</p>
              <p className="mt-0.5" style={{ color: holColors.plum800 }}>{selected.joined}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: holColors.plum500 }}>Next renewal</p>
              <p className="mt-0.5" style={{ color: holColors.plum800 }}>{selected.nextRenewal ?? '—'}</p>
            </div>
          </div>

          <div className="border-t pt-5" style={{ borderColor: holColors.cream200 }}>
            <h3 className="mb-3 text-sm font-semibold" style={{ color: holColors.plum800 }}>
              Grant a trial membership
            </h3>
            <div className="flex items-center gap-3">
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: holColors.cream300 }}
              >
                {DURATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                onClick={handleGrant}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                style={{ backgroundColor: holColors.pink500 }}
              >
                Grant trial
              </button>
            </div>
            {grantMessage && (
              <p className="mt-3 text-sm" style={{ color: holColors.gold500 }}>{grantMessage}</p>
            )}
          </div>
        </div>
      )}
    </HolYogaShell>
  );
}
