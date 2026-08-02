'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

import TenantSwitcher from '@/components/TenantSwitcher';
import { useTenant } from '@/contexts/TenantContext';
import { auth, firebaseInitError } from '@/lib/firebase';

const TABS = [
  ['exec', 'Exec readout'],
  ['activation', 'Activation & maintenance'],
  ['riders', 'Rider distribution'],
  ['events', 'Journeys & events'],
];

const number = new Intl.NumberFormat('en-GB');

function workspaceAllowed(tenant) {
  const name = String(tenant?.name || '').trim().toLowerCase();
  return name === 'sidestand' || name === 'arcturusdc';
}
function dateTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function Section({ eyebrow, title, note, children, rail = false }) {
  return (
    <section className={`sidestand-panel p-5 sm:p-6 ${rail ? 'sidestand-status-rail' : ''}`}>
      <header className="sidestand-rule pb-3">
        <p className="sidestand-mono text-[9px] font-semibold uppercase tracking-[.18em] text-[#ff4d00]">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-black uppercase tracking-[-.01em]">{title}</h2>
        {note ? <p className="mt-2 max-w-3xl text-xs font-semibold leading-5 text-[#6b6b67]">{note}</p> : null}
      </header>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Metric({ label, value, note, accent = false }) {
  return (
    <div className={`bg-[#fbfbf9] p-4 ${accent ? 'sidestand-status-rail' : 'sidestand-quiet-rail'}`}>
      <p className="sidestand-mono text-[9px] font-semibold uppercase tracking-[.12em] text-[#6b6b67]">{label}</p>
      <p className="mt-2 text-3xl font-black tabular-nums tracking-[-.03em]">{value}</p>
      {note ? <p className="sidestand-mono mt-1 text-[9px] uppercase tracking-[.04em] text-[#8a8a85]">{note}</p> : null}
    </div>
  );
}

function Funnel({ rows }) {
  const max = Math.max(...rows.map((row) => row.count), 1);
  return (
    <div className="space-y-4">
      {rows.map((row, index) => (
        <div key={row.stage}>
          <div className="mb-1.5 flex items-end justify-between gap-4">
            <div>
              <span className="sidestand-mono mr-2 text-[9px] font-semibold tracking-[.12em] text-[#8a8a85]">{String(index + 1).padStart(2, '0')}</span>
              <span className="text-sm font-extrabold uppercase">{row.label}</span>
            </div>
            <span className="sidestand-mono text-[10px] font-semibold">{row.count} / {row.pct}%</span>
          </div>
          <div className="sidestand-dot-field h-3 border-y border-[#c9c8c3]">
            <div className="sidestand-dot-fill h-full" style={{ width: `${(row.count / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function RegistrationStrip({ points }) {
  if (!points.length) return <p className="sidestand-mono text-[10px] uppercase text-[#8a8a85]">No real-rider registrations yet.</p>;
  const max = Math.max(...points.map((point) => point.count), 1);
  return (
    <div className="flex h-36 items-end gap-1 border-b-2 border-[#131313] px-1">
      {points.map((point) => (
        <div key={`${point.date}-${point.count}`} className="group relative min-w-3 flex-1 bg-[#131313]" style={{ height: `${Math.max(8, (point.count / max) * 100)}%` }}>
          <span className="sidestand-mono absolute bottom-full left-1/2 hidden -translate-x-1/2 bg-[#131313] px-2 py-1 text-[8px] text-[#f1f0ed] group-hover:block">{point.date} · {point.count}</span>
        </div>
      ))}
    </div>
  );
}

function Distribution({ title, data }) {
  const max = Math.max(...data.buckets.map((bucket) => bucket.count), 1);
  return (
    <div className="border border-[#c9c8c3] p-4">
      <h3 className="text-sm font-black uppercase">{title}</h3>
      <div className="mt-4 space-y-2">
        {data.buckets.map((bucket) => (
          <div key={bucket.label} className="grid grid-cols-[38px_1fr_26px] items-center gap-2">
            <span className="sidestand-mono text-[9px]">{bucket.label}</span>
            <div className="sidestand-dot-field h-2"><div className="sidestand-dot-fill h-2" style={{ width: `${(bucket.count / max) * 100}%` }} /></div>
            <span className="sidestand-mono text-right text-[9px]">{bucket.count}</span>
          </div>
        ))}
      </div>
      <p className="sidestand-mono mt-4 border-t border-[#c9c8c3] pt-3 text-[8px] uppercase tracking-[.06em] text-[#6b6b67]">
        MIN {data.summary.min} · MEDIAN {data.summary.median} · MEAN {data.summary.mean} · MAX {data.summary.max}
      </p>
    </div>
  );
}

function EventTable({ events }) {
  const visible = events.filter((event) => !['screen_view', 'user_engagement', 'session_start', 'first_open'].includes(event.eventName)).slice(0, 20);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-left">
        <thead className="sidestand-mono border-b-2 border-[#131313] text-[9px] uppercase tracking-[.12em]"><tr><th className="py-2">Event</th><th className="py-2 text-right">Count</th></tr></thead>
        <tbody>{visible.map((event) => <tr key={event.eventName} className="border-b border-[#c9c8c3]"><td className="sidestand-mono py-3 text-[10px] font-medium uppercase">{event.eventName.replaceAll('_', ' ')}</td><td className="sidestand-mono py-3 text-right text-[11px] font-semibold">{number.format(event.count)}</td></tr>)}</tbody>
      </table>
      {!visible.length ? <p className="sidestand-mono py-5 text-[10px] uppercase text-[#8a8a85]">No custom events returned.</p> : null}
    </div>
  );
}

export default function SidestandDashboardClient() {
  const router = useRouter();
  const { currentTenant, loading: tenantLoading, isSuperAdmin, isWorkspaceAdmin } = useTenant();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('exec');
  const allowed = workspaceAllowed(currentTenant);
  const canAdmin = Boolean(isSuperAdmin || isWorkspaceAdmin);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('tab');
    if (TABS.some(([id]) => id === requested)) setTab(requested);
  }, []);

  useEffect(() => {
    if (!auth) {
      setAuthReady(true);
      setError(firebaseInitError ? 'Firebase client configuration is invalid in this environment.' : 'Firebase sign-in is unavailable.');
      return undefined;
    }
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      if (!nextUser) router.replace('/apps/stea?next=/apps/stea/sidestand/dashboard');
    });
  }, [router]);

  const load = useCallback(async () => {
    if (!user || !currentTenant?.id || !allowed || !canAdmin) return;
    setLoading(true);
    setError('');
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/stea/sidestand/dashboard?tenantId=${encodeURIComponent(currentTenant.id)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not load Sidestand analytics.');
      setSnapshot(payload.snapshot);
    } catch (loadError) {
      setError(loadError.message || 'Could not load Sidestand analytics.');
    } finally {
      setLoading(false);
    }
  }, [allowed, canAdmin, currentTenant?.id, user]);

  useEffect(() => { void load(); }, [load]);

  function switchTab(next) {
    setTab(next);
    const url = new URL(window.location.href);
    if (next === 'exec') url.searchParams.delete('tab'); else url.searchParams.set('tab', next);
    window.history.replaceState(null, '', url.toString());
  }

  const gaEvents = useMemo(() => snapshot?.ga4?.eventCounts || [], [snapshot]);

  if (!authReady || tenantLoading) return <div className="sidestand-shell flex min-h-[70vh] items-center justify-center"><p className="sidestand-mono text-[10px] uppercase tracking-[.16em]">Checking workspace access…</p></div>;

  if (!user || !allowed || !canAdmin) {
    return (
      <main className="sidestand-shell px-5 py-14"><div className="sidestand-panel sidestand-status-rail mx-auto max-w-2xl p-6"><p className="sidestand-mono text-[9px] font-semibold uppercase tracking-[.18em] text-[#ff4d00]">Access check</p><h1 className="mt-2 text-2xl font-black uppercase">Workspace admin required</h1><p className="mt-3 text-sm font-semibold text-[#4a4a46]">Select Sidestand or ArcturusDC with an admin account.</p><div className="mt-5"><TenantSwitcher /></div>{error ? <p className="sidestand-mono mt-4 text-[9px] uppercase text-[#c63c00]">{error}</p> : null}</div></main>
    );
  }

  return (
    <main className="sidestand-shell px-4 py-8 sm:px-7">
      <div className="mx-auto max-w-[1300px]">
        <header className="sidestand-rule flex flex-col gap-5 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3"><img src="/img/sidestand-logo-glyph.svg" alt="" className="h-9 w-9" /><p className="sidestand-mono text-[9px] font-semibold uppercase tracking-[.16em] text-[#6b6b67]"><Link href="/apps/stea/sidestand" className="hover:text-[#c63c00]">Sidestand</Link> / Analytics</p></div>
            <h1 className="mt-4 text-4xl font-black uppercase tracking-[-.03em]">Rider telemetry</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#4a4a46]">Real-rider activation and ownership-record health. Founder, device and store-review accounts are excluded by `internalType`.</p>
          </div>
          <div className="flex flex-wrap items-end gap-3"><div><p className="sidestand-mono text-[8px] uppercase tracking-[.12em] text-[#8a8a85]">Data as of</p><p className="sidestand-mono mt-1 text-[10px] font-semibold">{dateTime(snapshot?.generatedAt)}</p></div><button type="button" onClick={load} disabled={loading} className="sidestand-button px-4 py-3 text-xs font-black uppercase">{loading ? 'Reading…' : 'Refresh data'}</button><TenantSwitcher /></div>
        </header>

        <div className="sidestand-panel sidestand-mono mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 text-[9px] font-semibold uppercase tracking-[.08em]"><span className="text-[#ff4d00]">CAPTURED</span><span>→</span><span>FIRESTORE</span><span>→</span><span>{snapshot ? 'READOUT READY' : loading ? 'TRANSMITTING' : 'AWAITING DATA'}</span>{snapshot ? <span className="ml-auto text-[#6b6b67]">{snapshot.totals.internalExcluded} INTERNAL EXCLUDED</span> : null}</div>

        <nav className="mt-4 flex flex-wrap gap-2" aria-label="Analytics sections">{TABS.map(([id, label]) => <button key={id} type="button" className="sidestand-tab px-3 py-2 text-xs font-black uppercase" aria-pressed={tab === id} onClick={() => switchTab(id)}>{label}</button>)}</nav>
        {error ? <div className="sidestand-panel sidestand-status-rail sidestand-mono mt-5 p-4 text-[10px] font-semibold uppercase text-[#c63c00]">{error}</div> : null}
        {loading && !snapshot ? <div className="sidestand-mono flex min-h-[35vh] items-center justify-center text-[10px] uppercase tracking-[.14em]">Reading Sidestand records…</div> : null}

        {snapshot ? <div className="mt-6 space-y-4">
          {tab === 'exec' ? <>
            <section className="grid gap-px border border-[#c9c8c3] bg-[#c9c8c3] sm:grid-cols-2 lg:grid-cols-5">
              <Metric label="Real riders" value={number.format(snapshot.totals.registeredUsers)} note={`${snapshot.totals.internalExcluded} internal excluded`} />
              <Metric label="Active / 30d" value={number.format(snapshot.totals.active30d)} note={`${snapshot.totals.active7d} in 7d`} />
              <Metric label="Bikes" value={number.format(snapshot.totals.bikes)} note={`${snapshot.totals.archivedBikes} archived`} />
              <Metric label="Maintenance logs" value={number.format(snapshot.totals.maintenanceEntries)} note={`${snapshot.totals.componentsTracked} components tracked`} />
              <Metric label="Tasks due" value={number.format(snapshot.totals.tasksDue)} note="Current server state" accent={snapshot.totals.tasksDue > 0} />
            </section>
            <div className="grid gap-4 lg:grid-cols-2"><Section eyebrow="Growth" title="Real-rider registrations" note="Cumulative from users.createdAt; internal accounts never enter the series."><RegistrationStrip points={snapshot.registrations} /></Section><Section eyebrow="Activation" title="Ownership record funnel" note="Distinct real riders at each independent lifetime stage."><Funnel rows={snapshot.funnel.slice(0, 5)} /></Section></div>
            <Section eyebrow="Plan mix" title="Premium state now" note="Sidestand Firestore does not currently contain a RevenueCat-mirrored subscription field for these riders, so this is a truthful current-state read rather than fabricated revenue history."><div className="grid gap-px border border-[#c9c8c3] bg-[#c9c8c3] sm:grid-cols-2"><Metric label="Free / no mirrored entitlement" value={snapshot.totals.freeUsers} /><Metric label="Premium mirrored" value={snapshot.totals.premiumUsers} accent={snapshot.totals.premiumUsers > 0} /></div></Section>
          </> : null}

          {tab === 'activation' ? <>
            <Section eyebrow="Activation" title="From account to durable record" note="This funnel excludes nine known non-person accounts and uses only server records—not GA4 joins."><Funnel rows={snapshot.funnel} /></Section>
            <div className="grid gap-px border border-[#c9c8c3] bg-[#c9c8c3] sm:grid-cols-2 lg:grid-cols-4"><Metric label="Components tracked" value={snapshot.totals.componentsTracked} /><Metric label="Tasks due" value={snapshot.totals.tasksDue} accent={snapshot.totals.tasksDue > 0} /><Metric label="Service entries" value={snapshot.totals.maintenanceEntries} /><Metric label="Rides logged" value={snapshot.totals.rides} /></div>
            <Section eyebrow="Interpretation" title="Small-cohort rules" rail><ul className="sidestand-mono space-y-3 text-[10px] font-medium uppercase leading-5 text-[#4a4a46]"><li>▪ Percentages are directional at this sample size; always read the raw count beside them.</li><li>▪ Internal accounts are excluded by the app’s server-owned `internalType`, not by an email list.</li><li>▪ Firestore shows completed records. GA4 shows consented interaction volume and cannot be joined to a named rider here.</li></ul></Section>
          </> : null}

          {tab === 'riders' ? <>
            <Section eyebrow="Distribution" title="How use is spread" note="Every real rider counted once. This reveals whether totals come from one power user or broad adoption."><div className="grid gap-3 md:grid-cols-2"><Distribution title="Bikes per rider" data={snapshot.distributions.bikes} /><Distribution title="Rides per rider" data={snapshot.distributions.rides} /><Distribution title="Maintenance logs per rider" data={snapshot.distributions.maintenance} /><Distribution title="Documents per rider" data={snapshot.distributions.documents} /></div></Section>
            <Section eyebrow="Pseudonymous detail" title="Rider ledger" note="Stable one-way codes only; no emails, names or raw Firebase UIDs leave the server response."><div className="overflow-x-auto"><table className="w-full min-w-[760px] border-collapse text-left"><thead className="sidestand-mono border-b-2 border-[#131313] text-[8px] uppercase tracking-[.1em]"><tr><th className="py-2">Rider</th><th>Bikes</th><th>Rides</th><th>Service</th><th>Trips</th><th>Docs</th><th>Due</th><th>Last record</th></tr></thead><tbody>{snapshot.riders.map((rider) => <tr key={rider.code} className="sidestand-mono border-b border-[#c9c8c3] text-[9px]"><td className="py-3 font-semibold">{rider.code}</td><td>{rider.bikes}</td><td>{rider.rides}</td><td>{rider.maintenance}</td><td>{rider.trips}</td><td>{rider.documents}</td><td className={rider.maintenanceDue ? 'text-[#c63c00]' : ''}>{rider.maintenanceDue ? 'DUE' : 'OK'}</td><td>{dateTime(rider.lastActiveAt)}</td></tr>)}</tbody></table></div></Section>
          </> : null}

          {tab === 'events' ? <>
            <section className="grid gap-px border border-[#c9c8c3] bg-[#c9c8c3] sm:grid-cols-2 lg:grid-cols-5"><Metric label="Trips" value={snapshot.totals.trips} /><Metric label="Stops" value={snapshot.totals.stops} /><Metric label="Documents" value={snapshot.totals.documents} /><Metric label="Feedback" value={snapshot.totals.feedback} /><Metric label="GA sessions / 30d" value={snapshot.ga4.available ? snapshot.ga4.last30d.sessions : '—'} note={snapshot.ga4.available ? `${snapshot.ga4.last30d.activeUsers} active users` : 'Access pending'} /></section>
            <Section eyebrow="Firebase Analytics" title="Consented app events" note="Aggregate only. Automatic GA noise is hidden so the product actions remain legible.">{snapshot.ga4.available ? <EventTable events={gaEvents} /> : <div className="sidestand-status-rail bg-[#f1f0ed] p-4"><p className="text-sm font-extrabold">GA4 access pending</p><p className="sidestand-mono mt-2 text-[9px] uppercase leading-5 text-[#6b6b67]">{snapshot.ga4.error} Property {snapshot.ga4.propertyId} is already linked to both Sidestand apps.</p></div>}</Section>
          </> : null}
        </div> : null}
      </div>
    </main>
  );
}
