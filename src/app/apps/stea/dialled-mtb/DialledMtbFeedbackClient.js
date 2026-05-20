'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useTenant } from '@/contexts/TenantContext';
import TenantSwitcher from '@/components/TenantSwitcher';

const STATUSES = [
  ['new', 'New'],
  ['reviewing', 'Reviewing'],
  ['planned', 'Planned'],
  ['done', 'Done'],
  ['wont_do', "Won't do"],
];

const PRIORITIES = [
  ['unset', 'Unset'],
  ['low', 'Low'],
  ['medium', 'Medium'],
  ['high', 'High'],
  ['urgent', 'Urgent'],
];

const TYPES = [
  ['bug', 'Bug'],
  ['confusing', 'Confusing'],
  ['idea', 'Idea'],
  ['setup_accuracy', 'Setup'],
  ['strava', 'Strava'],
  ['other', 'Other'],
];

const ALLOWED_WORKSPACE_NAMES = ['Dialled MTB', 'ArcturusDC'];

const statusTone = {
  new: 'border-[#F72585]/50 bg-[#F72585]/15 text-[#F72585]',
  reviewing: 'border-[#60A5FA]/40 bg-[#60A5FA]/12 text-[#93C5FD]',
  planned: 'border-[#F59E0B]/40 bg-[#F59E0B]/12 text-[#FBBF24]',
  done: 'border-[#34D399]/35 bg-[#34D399]/10 text-[#6EE7B7]',
  wont_do: 'border-[#6A7680]/40 bg-[#6A7680]/12 text-[#A7B0BA]',
};

const priorityTone = {
  unset: 'border-[#333840] text-[#8A939D]',
  low: 'border-[#6A7680]/40 text-[#A7B0BA]',
  medium: 'border-[#60A5FA]/45 text-[#93C5FD]',
  high: 'border-[#F59E0B]/45 text-[#FBBF24]',
  urgent: 'border-[#EF4444]/50 text-[#FCA5A5]',
};

function TriangleMark({ className = 'h-7 w-7' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M32 7 57 52H7L32 7Z" stroke="#F72585" strokeWidth="6" strokeLinejoin="round" />
      <path d="M32 19 46 44H18L32 19Z" fill="#1A1C1E" />
    </svg>
  );
}

function formatDate(value) {
  if (!value) return 'Unknown';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return 'Unknown';
  }
}

function labelFor(options, value) {
  return options.find(([key]) => key === value)?.[1] || value || 'Unknown';
}

function hasFeedbackWorkspaceAccess(tenant) {
  const tenantName = tenant?.name?.trim().toLowerCase();
  return ALLOWED_WORKSPACE_NAMES.some((name) => name.toLowerCase() === tenantName);
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#6A7680]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-lg border border-[#333840] bg-[#151719] px-3 text-sm font-medium normal-case tracking-normal text-[#E8ECF0] outline-none transition focus:border-[#F72585] focus:ring-2 focus:ring-[#F72585]/20"
      >
        {options.map(([key, itemLabel]) => (
          <option key={key} value={key}>
            {itemLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function Badge({ children, className = '' }) {
  return (
    <span className={`inline-flex h-7 items-center rounded-md border px-2 text-xs font-bold ${className}`}>
      {children}
    </span>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-lg border border-dashed border-[#333840] bg-[#151719] px-6 text-center text-sm text-[#8A939D]">
      {message}
    </div>
  );
}

export default function DialledMtbFeedbackClient() {
  const router = useRouter();
  const { currentTenant, loading: tenantLoading, isSuperAdmin, isWorkspaceAdmin } = useTenant();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    type: '',
    platform: '',
    hasScreenshot: '',
    q: '',
  });
  const searchRef = useRef(null);
  const [notifPermission, setNotifPermission] = useState('default');
  const knownIdsRef = useRef(null);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) || items[0] || null,
    [items, selectedId],
  );

  const establishSession = useCallback(async (firebaseUser) => {
    if (!firebaseUser) return;
    const idToken = await firebaseUser.getIdToken();
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    if (!response.ok) {
      throw new Error('Could not establish STEa session.');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);

      if (!firebaseUser) {
        setSessionReady(false);
        router.replace('/apps/stea?next=/apps/stea/dialled-mtb');
        return;
      }

      try {
        await establishSession(firebaseUser);
        setSessionReady(true);
      } catch (nextError) {
        setError(nextError?.message || 'Could not establish STEa session.');
      }
    });

    return () => unsubscribe();
  }, [establishSession, router]);

  const loadFeedback = useCallback(async () => {
    if (!sessionReady || tenantLoading || !currentTenant?.id || !hasFeedbackWorkspaceAccess(currentTenant)) return;

    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (currentTenant?.id) params.set('tenantId', currentTenant.id);
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      const response = await fetch(`/api/stea/dialled-mtb/feedback?${params.toString()}`, {
        cache: 'no-store',
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Could not load feedback.');

      setItems(payload.items || []);
      setSummary(payload.summary || null);
      setSelectedId((previous) => {
        if (previous && payload.items?.some((item) => item.id === previous)) return previous;
        return payload.items?.[0]?.id || null;
      });
    } catch (nextError) {
      setError(nextError?.message || 'Could not load feedback.');
    } finally {
      setLoading(false);
    }
  }, [currentTenant, filters, sessionReady, tenantLoading]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  // Initialise notification permission state
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  // Track new items and fire browser notifications
  useEffect(() => {
    if (items.length === 0) return;
    if (knownIdsRef.current === null) {
      knownIdsRef.current = new Set(items.map((i) => i.id));
      return;
    }
    const newItems = items.filter((i) => !knownIdsRef.current.has(i.id));
    if (newItems.length > 0 && notifPermission === 'granted') {
      const newest = newItems[0];
      new Notification('New feedback — Dialled MTB', {
        body: newest.message?.slice(0, 120) || 'New feedback submitted.',
        icon: '/favicon.ico',
        tag: `dialled-mtb-${newest.id}`,
      });
    }
    knownIdsRef.current = new Set(items.map((i) => i.id));
  }, [items, notifPermission]);

  // Auto-poll every 30 seconds
  useEffect(() => {
    if (!sessionReady) return;
    const id = setInterval(() => loadFeedback(), 30_000);
    return () => clearInterval(id);
  }, [sessionReady, loadFeedback]);

  async function requestNotifPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  }

  async function updateFeedback(id, updates) {
    if (!id) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/stea/dialled-mtb/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          tenantId: currentTenant?.id,
          ...updates,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Could not update feedback.');
      await loadFeedback();
    } catch (nextError) {
      setError(nextError?.message || 'Could not update feedback.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    await signOut(auth);
    router.replace('/apps/stea');
  }

  if (!authReady || tenantLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#101113] text-[#8A939D]">
        <div className="rounded-lg border border-[#333840] bg-[#1A1C1E] px-5 py-4 text-sm">Checking Dialled MTB admin access...</div>
      </main>
    );
  }

  if (!user || (!isSuperAdmin && !isWorkspaceAdmin && !currentTenant)) {
    return null;
  }

  if (!hasFeedbackWorkspaceAccess(currentTenant)) {
    return (
      <main className="min-h-screen bg-[#101113] text-[#E8ECF0]">
        <header className="border-b border-[#333840] bg-[#111214]">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between lg:px-8">
            <div className="flex items-center gap-4">
              <TriangleMark />
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-black tracking-[0.08em] text-[#F72585]">DIALLED</span>
                  <span className="text-lg font-bold tracking-wide text-[#8A939D]">MTB</span>
                </div>
                <p className="mt-1 text-sm text-[#6A7680]">Workspace access required</p>
              </div>
            </div>
            <TenantSwitcher />
          </div>
        </header>
        <section className="mx-auto flex min-h-[60vh] max-w-3xl items-center px-5">
          <div className="rounded-lg border border-[#333840] bg-[#1A1C1E] p-6">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#F72585]">Select workspace</p>
            <h1 className="mt-3 text-3xl font-black text-[#F4F6F8]">User Feedback is available from Dialled MTB or ArcturusDC.</h1>
            <p className="mt-3 text-sm font-medium leading-6 text-[#A7B0BA]">
              Switch to the Dialled MTB workspace for product access, or ArcturusDC for internal admin access. Partner access should still be managed through the relevant workspace in STEa Admin.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#101113] text-[#E8ECF0]">
      <header className="border-b border-[#333840] bg-[#111214]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <TriangleMark />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/apps/stea" className="text-xl font-black tracking-[0.08em] text-[#F72585]">
                  DIALLED
                </Link>
                <span className="text-lg font-bold tracking-wide text-[#8A939D]">MTB</span>
                <span className="hidden h-5 w-px bg-[#333840] sm:block" />
                <span className="text-sm font-semibold text-[#8A939D]">User Feedback</span>
              </div>
              <p className="mt-1 text-sm text-[#6A7680]">Dialled MTB feedback / User Feedback tool</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <TenantSwitcher />
            <NotifToggle permission={notifPermission} onRequest={requestNotifPermission} />
            <button
              type="button"
              onClick={loadFeedback}
              disabled={loading}
              className="h-10 rounded-lg border border-[#333840] px-3 text-sm font-bold text-[#E8ECF0] transition hover:border-[#F72585] disabled:opacity-60"
            >
              {loading ? 'Refreshing' : 'Refresh'}
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="h-10 rounded-lg border border-[#333840] px-3 text-sm font-bold text-[#8A939D] transition hover:border-[#F72585] hover:text-[#E8ECF0]"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <section className="border-b border-[#3A0A20] bg-[#2A0717]">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[1fr_520px] lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#F72585]">User Feedback</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black leading-none tracking-tight text-[#F4F6F8] md:text-6xl">
              User Feedback
            </h1>
            <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-[#B8C0C8]">
              Review user feedback in one place, connect notes to screenshots, and mark what needs product attention next.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
            <Metric label="Total" value={summary?.total ?? '-'} />
            <Metric label="Open" value={summary?.open ?? '-'} accent />
            <Metric label="Urgent" value={summary?.urgent ?? '-'} danger />
            <Metric label="Screenshots" value={summary?.screenshots ?? '-'} />
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[380px_1fr] lg:px-8">
        <aside className="space-y-4">
          <div className="rounded-lg border border-[#333840] bg-[#1A1C1E] p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-[#F72585]">Filters</h2>
              <button
                type="button"
                onClick={() => {
                  setFilters({ status: '', priority: '', type: '', platform: '', hasScreenshot: '', q: '' });
                  if (searchRef.current) searchRef.current.value = '';
                }}
                className="text-xs font-bold text-[#8A939D] transition hover:text-[#F72585]"
              >
                Clear
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#6A7680]">
                Search
                <input
                  ref={searchRef}
                  type="search"
                  value={filters.q}
                  onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
                  placeholder="Message, tester, screen"
                  className="h-10 rounded-lg border border-[#333840] bg-[#151719] px-3 text-sm font-medium normal-case tracking-normal text-[#E8ECF0] outline-none transition placeholder:text-[#56606A] focus:border-[#F72585] focus:ring-2 focus:ring-[#F72585]/20"
                />
              </label>
              <SelectField label="Status" value={filters.status} onChange={(value) => setFilters((current) => ({ ...current, status: value }))} options={[['', 'Any status'], ...STATUSES]} />
              <SelectField label="Priority" value={filters.priority} onChange={(value) => setFilters((current) => ({ ...current, priority: value }))} options={[['', 'Any priority'], ...PRIORITIES]} />
              <SelectField label="Type" value={filters.type} onChange={(value) => setFilters((current) => ({ ...current, type: value }))} options={[['', 'Any type'], ...TYPES]} />
              <SelectField label="Platform" value={filters.platform} onChange={(value) => setFilters((current) => ({ ...current, platform: value }))} options={[['', 'Any platform'], ['ios', 'iOS'], ['android', 'Android'], ['web', 'Web']]} />
              <SelectField label="Screenshot" value={filters.hasScreenshot} onChange={(value) => setFilters((current) => ({ ...current, hasScreenshot: value }))} options={[['', 'Any'], ['true', 'Attached'], ['false', 'None']]} />
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-[#333840] bg-[#1A1C1E]">
            <div className="border-b border-[#333840] px-4 py-3">
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-[#F72585]">Queue</h2>
            </div>
            <div className="max-h-[720px] overflow-y-auto">
              {items.length === 0 ? (
                <div className="p-4">
                  <EmptyState message={loading ? 'Loading feedback...' : 'No feedback matches these filters.'} />
                </div>
              ) : (
                items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`grid w-full gap-2 border-b border-[#2A2E34] px-4 py-4 text-left transition last:border-b-0 hover:bg-[#22262A] ${
                      selected?.id === item.id ? 'bg-[#2A0B1B]' : 'bg-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge className={statusTone[item.status] || statusTone.new}>{labelFor(STATUSES, item.status)}</Badge>
                      <span className="text-xs font-semibold text-[#6A7680]">{formatDate(item.createdAt)}</span>
                    </div>
                    <p className="line-clamp-2 text-sm font-semibold leading-5 text-[#E8ECF0]">{item.message || 'No message supplied.'}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={priorityTone[item.priority] || priorityTone.unset}>{labelFor(PRIORITIES, item.priority)}</Badge>
                      <span className="text-xs font-semibold text-[#8A939D]">{labelFor(TYPES, item.type)}</span>
                      {item.screenshotPath ? <span className="text-xs font-bold text-[#F72585]">Screenshot</span> : null}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          {error ? (
            <div className="mb-4 rounded-lg border border-[#EF4444]/40 bg-[#3A1215] px-4 py-3 text-sm font-semibold text-[#FCA5A5]">
              {error}
            </div>
          ) : null}

          {!selected ? (
            <EmptyState message="Select feedback from the queue to triage it." />
          ) : (
            <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
              <article className="min-w-0 rounded-lg border border-[#333840] bg-[#1A1C1E]">
                <div className="border-b border-[#333840] p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={statusTone[selected.status] || statusTone.new}>{labelFor(STATUSES, selected.status)}</Badge>
                    <Badge className={priorityTone[selected.priority] || priorityTone.unset}>{labelFor(PRIORITIES, selected.priority)}</Badge>
                    <Badge className="border-[#333840] text-[#B8C0C8]">{labelFor(TYPES, selected.type)}</Badge>
                  </div>
                  <h2 className="mt-4 text-2xl font-black leading-tight text-[#F4F6F8]">{selected.screen || selected.routeName || 'Feedback'}</h2>
                  <p className="mt-2 text-sm font-medium text-[#8A939D]">
                    {selected.displayName || selected.email || 'Unknown tester'} / {formatDate(selected.createdAt)}
                  </p>
                </div>

                <div className="space-y-5 p-5">
                  <section>
                    <h3 className="text-xs font-black uppercase tracking-[0.18em] text-[#F72585]">Message</h3>
                    <p className="mt-3 whitespace-pre-wrap rounded-lg border border-[#333840] bg-[#151719] p-4 text-base font-medium leading-7 text-[#D7DDE3]">
                      {selected.message}
                    </p>
                  </section>

                  <section>
                    <h3 className="text-xs font-black uppercase tracking-[0.18em] text-[#F72585]">Screenshot</h3>
                    {selected.screenshotUrl ? (
                      <a href={selected.screenshotUrl} target="_blank" rel="noreferrer" className="mt-3 block overflow-hidden rounded-lg border border-[#333840] bg-[#151719]">
                        <img src={selected.screenshotUrl} alt="Attached feedback screenshot" className="max-h-[620px] w-full object-contain" />
                      </a>
                    ) : (
                      <div className="mt-3 rounded-lg border border-dashed border-[#333840] bg-[#151719] px-4 py-8 text-center text-sm font-medium text-[#6A7680]">
                        No screenshot attached.
                      </div>
                    )}
                  </section>
                </div>
              </article>

              <aside className="space-y-5">
                <div className="rounded-lg border border-[#333840] bg-[#1A1C1E] p-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.18em] text-[#F72585]">Triage</h3>
                  <div className="mt-4 grid gap-3">
                    <SelectField label="Status" value={selected.status} onChange={(value) => updateFeedback(selected.id, { status: value })} options={STATUSES} />
                    <SelectField label="Priority" value={selected.priority} onChange={(value) => updateFeedback(selected.id, { priority: value })} options={PRIORITIES} />
                    <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#6A7680]">
                      Internal notes
                      <textarea
                        key={selected.id}
                        defaultValue={selected.adminNotes || ''}
                        rows={6}
                        onBlur={(event) => {
                          if (event.target.value !== (selected.adminNotes || '')) {
                            updateFeedback(selected.id, { adminNotes: event.target.value });
                          }
                        }}
                        className="rounded-lg border border-[#333840] bg-[#151719] px-3 py-2 text-sm font-medium normal-case leading-6 tracking-normal text-[#E8ECF0] outline-none transition placeholder:text-[#56606A] focus:border-[#F72585] focus:ring-2 focus:ring-[#F72585]/20"
                        placeholder="Decision, follow-up, duplicate, candidate fix..."
                      />
                    </label>
                    {saving ? <p className="text-xs font-bold text-[#F72585]">Saving triage...</p> : null}
                  </div>
                </div>

                <div className="rounded-lg border border-[#333840] bg-[#1A1C1E] p-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.18em] text-[#F72585]">Context</h3>
                  <dl className="mt-4 grid gap-3 text-sm">
                    <ContextRow label="Tester" value={selected.email || selected.displayName} />
                    <ContextRow label="Platform" value={selected.platform} />
                    <ContextRow label="Device" value={selected.deviceModel} />
                    <ContextRow label="OS" value={selected.osVersion} />
                    <ContextRow label="Version" value={[selected.appVersion, selected.buildNumber].filter(Boolean).join(' / ')} />
                    <ContextRow label="Route" value={selected.routeName} />
                    <ContextRow label="Bike" value={selected.activeBikeName || selected.activeBikeId} />
                    <ContextRow label="Premium" value={selected.premium === null ? null : selected.premium ? 'Yes' : 'No'} />
                    <ContextRow label="Strava" value={selected.stravaConnected === null ? null : selected.stravaConnected ? 'Connected' : 'Not connected'} />
                    <ContextRow label="Last event" value={selected.lastClientEvent} />
                    <ContextRow label="Reviewed by" value={selected.reviewedBy} />
                  </dl>
                </div>
              </aside>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, accent = false, danger = false }) {
  const tone = danger ? 'text-[#FCA5A5]' : accent ? 'text-[#F72585]' : 'text-[#F4F6F8]';
  return (
    <div className="rounded-lg border border-[#3A1530] bg-[#1A1C1E]/80 px-4 py-4">
      <div className={`text-3xl font-black leading-none ${tone}`}>{value}</div>
      <div className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-[#6A7680]">{label}</div>
    </div>
  );
}

function ContextRow({ label, value }) {
  return (
    <div className="grid gap-1 border-b border-[#2A2E34] pb-3 last:border-b-0 last:pb-0">
      <dt className="text-xs font-black uppercase tracking-[0.16em] text-[#56606A]">{label}</dt>
      <dd className="break-words font-semibold text-[#C7CED6]">{value || 'Not captured'}</dd>
    </div>
  );
}

function NotifToggle({ permission, onRequest }) {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;

  if (permission === 'granted') {
    return (
      <div
        title="Browser notifications on — polls every 30s"
        className="flex h-10 items-center gap-2 rounded-lg border border-[#34D399]/40 bg-[#34D399]/10 px-3 text-xs font-bold text-[#6EE7B7]"
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M10 2a6 6 0 0 0-6 6v2.586l-.707.707A1 1 0 0 0 4 13h12a1 1 0 0 0 .707-1.707L16 10.586V8a6 6 0 0 0-6-6ZM10 18a2 2 0 0 1-2-2h4a2 2 0 0 1-2 2Z" />
        </svg>
        Notifications on
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div
        title="Notifications blocked in browser settings"
        className="flex h-10 items-center gap-2 rounded-lg border border-[#6A7680]/40 px-3 text-xs font-bold text-[#6A7680]"
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M10 2a6 6 0 0 0-6 6v2.586l-.707.707A1 1 0 0 0 4 13h12a1 1 0 0 0 .707-1.707L16 10.586V8a6 6 0 0 0-6-6ZM10 18a2 2 0 0 1-2-2h4a2 2 0 0 1-2 2Z" />
        </svg>
        Notifications blocked
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onRequest}
      title="Enable browser notifications for new feedback"
      className="flex h-10 items-center gap-2 rounded-lg border border-[#333840] px-3 text-xs font-bold text-[#8A939D] transition hover:border-[#F72585] hover:text-[#E8ECF0]"
    >
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M10 2a6 6 0 0 0-6 6v2.586l-.707.707A1 1 0 0 0 4 13h12a1 1 0 0 0 .707-1.707L16 10.586V8a6 6 0 0 0-6-6ZM10 18a2 2 0 0 1-2-2h4a2 2 0 0 1-2 2Z" />
      </svg>
      Enable notifications
    </button>
  );
}
