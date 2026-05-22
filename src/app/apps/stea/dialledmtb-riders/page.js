'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import SteaAppsDropdown from '@/components/SteaAppsDropdown';

const SUPER_ADMINS = ['repinfaust@gmail.com', 'daryn.shaxted@gmail.com'];

const DURATION_OPTIONS = [
  { value: 'monthly', label: '1 month' },
  { value: 'three_month', label: '3 months' },
  { value: 'six_month', label: '6 months' },
  { value: 'yearly', label: '1 year' },
  { value: 'lifetime', label: 'Lifetime' },
];

function FlagRow({ label, description, enabled, onEnable, onDisable, disabled }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-neutral-900">{label}</p>
        <p className="mt-0.5 text-xs text-neutral-500">{description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          enabled ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'
        }`}>
          {enabled ? 'Enabled' : 'Disabled'}
        </span>
        {enabled ? (
          <button
            onClick={onDisable}
            disabled={disabled}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:border-neutral-300 hover:text-neutral-900 disabled:opacity-50"
          >
            Disable
          </button>
        ) : (
          <button
            onClick={onEnable}
            disabled={disabled}
            className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50"
          >
            Enable
          </button>
        )}
      </div>
    </div>
  );
}

export default function DialledMTBRidersPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [rider, setRider] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [searchDone, setSearchDone] = useState(false);

  const [duration, setDuration] = useState('monthly');
  const [granting, setGranting] = useState(false);
  const [grantSuccess, setGrantSuccess] = useState('');
  const [grantError, setGrantError] = useState('');

  const [featureFlags, setFeatureFlags] = useState(null);
  const [flagsLoading, setFlagsLoading] = useState(false);
  const [flagError, setFlagError] = useState('');
  const [featureNotes, setFeatureNotes] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (!firebaseUser) router.replace('/apps/stea?next=/apps/stea/dialledmtb-riders');
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (authReady && user && !SUPER_ADMINS.includes(user.email)) {
      router.replace('/apps/stea');
    }
  }, [authReady, user, router]);

  const fetchFeatureFlags = async (uid) => {
    setFlagsLoading(true);
    setFlagError('');
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/dialledmtb/feature-flags?uid=${encodeURIComponent(uid)}`, {
        headers: { 'x-id-token': idToken },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load feature flags');
      setFeatureFlags(data.flags ?? { labsEnabled: false, nfcBikeSwitchEnabled: false });
      setFeatureNotes(data.flags?.featureNotes ?? '');
    } catch (err) {
      setFlagError(err.message);
    } finally {
      setFlagsLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchError('');
    setGrantSuccess('');
    setGrantError('');
    setFlagError('');
    setRider(null);
    setFeatureFlags(null);
    setSearchDone(false);
    setSearching(true);

    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/dialledmtb/riders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), idToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setRider(data.user);
      setSearchDone(true);
      if (data.user) {
        await fetchFeatureFlags(data.user.uid);
      }
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleToggleFlag = async (flag, value) => {
    if (!rider) return;
    setFlagError('');
    setFlagsLoading(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/dialledmtb/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: rider.uid, flag, value, featureNotes, idToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update flag');
      setFeatureFlags(data.flags);
    } catch (err) {
      setFlagError(err.message);
    } finally {
      setFlagsLoading(false);
    }
  };

  const handleGrant = async () => {
    if (!rider) return;
    setGrantError('');
    setGrantSuccess('');
    setGranting(true);

    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/dialledmtb/grant-entitlement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: rider.uid, duration, idToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Grant failed');
      const label = DURATION_OPTIONS.find((d) => d.value === duration)?.label ?? duration;
      setGrantSuccess(`Granted ${label} trial to ${rider.email}`);
    } catch (err) {
      setGrantError(err.message);
    } finally {
      setGranting(false);
    }
  };

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    await signOut(auth);
    router.replace('/apps/stea');
  };

  if (!authReady) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-2xl border border-neutral-200 bg-white/80 px-6 py-5 text-sm text-neutral-600 shadow-sm">
          Checking access…
        </div>
      </div>
    );
  }

  if (!user || !SUPER_ADMINS.includes(user.email)) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SteaAppsDropdown />
          <div className="h-5 w-px bg-neutral-200" />
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Dialled MTB — Rider Management</h1>
            <p className="text-sm text-neutral-500">Look up riders, grant trials, and manage feature access</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900"
        >
          Sign out
        </button>
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">Find rider</h2>
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="rider@example.com"
            required
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
          />
          <button
            type="submit"
            disabled={searching}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
          >
            {searching ? 'Searching…' : 'Search'}
          </button>
        </form>

        {searchError && <p className="mt-3 text-sm text-red-600">{searchError}</p>}
        {searchDone && !rider && !searchError && (
          <p className="mt-3 text-sm text-neutral-500">No rider found for that email.</p>
        )}
      </div>

      {/* Rider card */}
      {rider && (
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">Rider</h2>

          <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Email</p>
              <p className="mt-0.5 text-neutral-900">{rider.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Display name</p>
              <p className="mt-0.5 text-neutral-900">{rider.displayName ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Auth provider</p>
              <p className="mt-0.5 capitalize text-neutral-900">{rider.authProvider ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Joined</p>
              <p className="mt-0.5 text-neutral-900">
                {rider.createdAt
                  ? new Date(rider.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Bikes</p>
              <p className="mt-0.5 text-neutral-900">{rider.bikeCount}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Rides</p>
              <p className="mt-0.5 text-neutral-900">{rider.totalRideCount}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Strava</p>
              <p className="mt-0.5 text-neutral-900">{rider.stravaConnected ? 'Connected' : 'Not connected'}</p>
            </div>
          </div>

          {/* UID */}
          <div className="mb-6 rounded-lg bg-neutral-50 px-4 py-3">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-400">Firebase UID</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all text-xs text-neutral-700">{rider.uid}</code>
              <button
                onClick={() => navigator.clipboard.writeText(rider.uid)}
                className="shrink-0 rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Feature Access */}
          <div className="border-t border-neutral-100 pt-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900">Feature Access / Labs</h3>
              {featureFlags?.updatedAt && (
                <p className="text-xs text-neutral-400">
                  Last updated {new Date(featureFlags.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {featureFlags.updatedBy ? ` by ${featureFlags.updatedBy}` : ''}
                </p>
              )}
            </div>

            {flagsLoading && !featureFlags && (
              <p className="py-3 text-sm text-neutral-400">Loading flags…</p>
            )}

            {featureFlags && (
              <div className="divide-y divide-neutral-100">
                <FlagRow
                  label="Labs enabled"
                  description="Shows the Labs section in Settings and allows access to experimental features."
                  enabled={featureFlags.labsEnabled}
                  onEnable={() => handleToggleFlag('labsEnabled', true)}
                  onDisable={() => handleToggleFlag('labsEnabled', false)}
                  disabled={flagsLoading}
                />
                <FlagRow
                  label="NFC Bike Switch"
                  description="Enables the NFC Bike Quick Switch feature inside Labs. Requires Labs enabled + Premium subscription."
                  enabled={featureFlags.nfcBikeSwitchEnabled}
                  onEnable={() => handleToggleFlag('nfcBikeSwitchEnabled', true)}
                  onDisable={() => handleToggleFlag('nfcBikeSwitchEnabled', false)}
                  disabled={flagsLoading}
                />
              </div>
            )}

            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-medium text-neutral-500">
                Feature notes / reason (saved with next toggle)
              </label>
              <input
                type="text"
                value={featureNotes}
                onChange={(e) => setFeatureNotes(e.target.value)}
                placeholder="e.g. Friendlies tester, NFC tag received"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
              />
            </div>

            {flagError && <p className="mt-3 text-sm text-red-600">{flagError}</p>}
          </div>

          {/* Grant entitlement */}
          <div className="border-t border-neutral-100 pt-5 mt-5">
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">Grant RevenueCat trial</h3>
            <div className="flex items-center gap-3">
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
              >
                {DURATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                onClick={handleGrant}
                disabled={granting}
                className="rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-pink-700 disabled:opacity-60"
              >
                {granting ? 'Granting…' : 'Grant trial'}
              </button>
            </div>

            {grantSuccess && <p className="mt-3 text-sm text-green-700">{grantSuccess}</p>}
            {grantError && <p className="mt-3 text-sm text-red-600">{grantError}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
