'use client';

/*
 * MLB Line-Movement Study — read-only viewer (D-SITE-008).
 * Observational research instrument: shows how the MLB total moves pre-game as
 * lineups/scratches/sharp money arrive. NOT a betting model — no predictions,
 * picks, EV, or LLM. Reads the tenant-scoped mlb_* collections written by the
 * Cloud Functions collector. Same access pattern as WC26.
 */

import { useEffect, useMemo, useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const ARCTURUSDC_TENANT_ID = 'FqhckqMaorJMAQ6B29mP';

/* ── data load ─────────────────────────────────────────────────────────────── */
async function loadStudyData() {
  if (!db) throw new Error('Firebase client database is unavailable in this environment.');
  const tf = where('tenantId', '==', ARCTURUSDC_TENANT_ID);
  const [gamesSnap, eventsSnap, metaDoc] = await Promise.all([
    getDocs(query(collection(db, 'mlb_games'), tf)),
    getDocs(query(collection(db, 'mlb_game_events'), tf)),
    getDoc(doc(db, 'mlb_meta', 'collector')),
  ]);

  const games = gamesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  // Sort newest-first client-side (event set is small — bounded by a day's slate),
  // avoiding a composite where(tenantId)+orderBy index.
  const events = eventsSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => String(b.detectedAtIso || '').localeCompare(String(a.detectedAtIso || '')));
  const meta = metaDoc.exists() ? metaDoc.data() : null;
  return { games, events, meta };
}

/* ── helpers ───────────────────────────────────────────────────────────────── */
const fmtLine = (v) => (Number.isFinite(v) ? v.toFixed(1) : '—');
const fmtDelta = (d) => (Number.isFinite(d) ? (d > 0 ? `+${d.toFixed(1)}` : d.toFixed(1)) : '—');
const eventLabel = {
  lineup_posted: 'Lineup posted',
  pitcher_change: 'Pitcher change',
  status_change: 'Status change',
};

function moveTone(delta) {
  if (!Number.isFinite(delta) || Math.abs(delta) < 0.25) return 'text-neutral-500';
  return delta > 0 ? 'text-emerald-600' : 'text-rose-600';
}

/* ── page ──────────────────────────────────────────────────────────────────── */
export default function MLBClient() {
  return (
    <AccessGate>
      <Study />
    </AccessGate>
  );
}

function AccessGate({ children }) {
  const { availableTenants, loading, error, isSuperAdmin } = useTenant();
  const hasAccess = isSuperAdmin || (availableTenants && availableTenants.length > 0);

  if (loading) {
    return (
      <Shell>
        <p className="text-sm uppercase tracking-widest text-neutral-500">STEa Access</p>
        <h1 className="mt-1 text-2xl font-extrabold">Checking access</h1>
        <p className="mt-2 text-neutral-600">Confirming your STEa membership.</p>
      </Shell>
    );
  }
  if (!hasAccess) {
    return (
      <Shell>
        <p className="text-sm uppercase tracking-widest text-neutral-500">STEa Access Required</p>
        <h1 className="mt-1 text-2xl font-extrabold">MLB Line-Movement Study</h1>
        <p className="mt-2 text-neutral-600">
          Available to any signed-in STEa member.
          {error ? ` Access lookup returned: ${error}` : ' Sign in with an authorised account to continue.'}
        </p>
        <a
          className="mt-4 inline-block rounded-lg bg-neutral-900 px-4 py-2 text-white"
          href="/apps/stea?next=/apps/stea/mlb"
        >
          Open STEa sign-in
        </a>
      </Shell>
    );
  }
  return children;
}

function Shell({ children }) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="rounded-2xl border border-black/10 bg-white p-6">{children}</div>
    </main>
  );
}

function Study() {
  const [state, setState] = useState({ status: 'loading', games: [], events: [], meta: null, error: null });

  useEffect(() => {
    let alive = true;
    loadStudyData()
      .then((data) => alive && setState({ status: 'ready', ...data, error: null }))
      .catch((err) => alive && setState({ status: 'error', games: [], events: [], meta: null, error: err.message }));
    return () => { alive = false; };
  }, []);

  const { upcoming, finalized } = useMemo(() => {
    const up = [];
    const fin = [];
    for (const g of state.games) {
      if (g.status === 'final' || g.finalTotal != null) fin.push(g);
      else up.push(g);
    }
    const byTime = (a, b) => String(a.scheduledFirstPitch || '').localeCompare(String(b.scheduledFirstPitch || ''));
    up.sort(byTime);
    fin.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    return { upcoming: up, finalized: fin.slice(0, 30) };
  }, [state.games]);

  const eventsByGame = useMemo(() => {
    const m = {};
    for (const e of state.events) (m[e.gameId] ||= []).push(e);
    return m;
  }, [state.events]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-4">
        <p className="text-xs uppercase tracking-widest text-neutral-500">STEa · Research</p>
        <h1 className="text-3xl font-extrabold tracking-tight">MLB Line-Movement Study</h1>
        <p className="mt-2 max-w-3xl text-sm text-neutral-600">
          An observational instrument, not a betting model. It records how the MLB total moves before
          first pitch as lineups post, pitchers are confirmed or scratched, and money arrives — to
          measure what moves the line, by how much, and how fast. No predictions, picks, or LLM.
        </p>
      </header>

      <CollectorHealth meta={state.meta} />

      {state.status === 'loading' && <Note>Loading study data…</Note>}
      {state.status === 'error' && <Note tone="error">Could not load data: {state.error}</Note>}

      {state.status === 'ready' && (
        <>
          <Section title={`Upcoming games (${upcoming.length})`}>
            {upcoming.length === 0 ? (
              <Note>
                No upcoming games with lines captured yet. Snapshots populate on the collector schedule
                (7 passes/day, ET); openers appear as books post them.
              </Note>
            ) : (
              <div className="space-y-3">
                {upcoming.map((g) => (
                  <GameRow key={g.id} game={g} events={eventsByGame[g.id] || []} />
                ))}
              </div>
            )}
          </Section>

          <Section title={`Recently finalized (${finalized.length})`}>
            {finalized.length === 0 ? (
              <Note>No finalized games yet — the finalizer runs at 03:30 ET and back-fills results + move summaries.</Note>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-neutral-500">
                      <th className="py-2 pr-3">Date</th>
                      <th className="py-2 pr-3">Matchup</th>
                      <th className="py-2 pr-3 text-right">Opener</th>
                      <th className="py-2 pr-3 text-right">Close</th>
                      <th className="py-2 pr-3 text-right">Move</th>
                      <th className="py-2 pr-3 text-right">Actual</th>
                      <th className="py-2 pr-3 text-right">Events</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finalized.map((g) => {
                      const opener = g.opener?.line;
                      const close = g.close?.line;
                      const delta = g.moveSummary?.delta;
                      return (
                        <tr key={g.id} className="border-t border-black/5">
                          <td className="py-2 pr-3 text-neutral-500">{g.date}</td>
                          <td className="py-2 pr-3">{g.away} @ {g.home}</td>
                          <td className="py-2 pr-3 text-right">{fmtLine(opener)}</td>
                          <td className="py-2 pr-3 text-right">{fmtLine(close)}</td>
                          <td className={`py-2 pr-3 text-right font-medium ${moveTone(delta)}`}>{fmtDelta(delta)}</td>
                          <td className="py-2 pr-3 text-right font-semibold">{Number.isFinite(g.finalTotal) ? g.finalTotal : '—'}</td>
                          <td className="py-2 pr-3 text-right text-neutral-500">{g.moveSummary?.nEvents ?? '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </>
      )}
    </main>
  );
}

function GameRow({ game, events }) {
  const opener = game.opener?.line;
  const latest = game.latest?.line;
  const delta = Number.isFinite(opener) && Number.isFinite(latest) ? latest - opener : null;
  return (
    <div className="rounded-xl border border-black/10 bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="font-semibold">{game.away} @ {game.home}</div>
        <div className="text-xs text-neutral-500">
          {game.scheduledFirstPitch ? new Date(game.scheduledFirstPitch).toLocaleString() : 'TBD'}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
        <span>Opener <strong>{fmtLine(opener)}</strong></span>
        <span>Latest <strong>{fmtLine(latest)}</strong></span>
        <span className={moveTone(delta)}>Move <strong>{fmtDelta(delta)}</strong></span>
        {game.latest && (
          <span className="text-neutral-500">
            O {game.latest.overDec ?? '—'} / U {game.latest.underDec ?? '—'}
          </span>
        )}
      </div>
      {(game.probablePitchers?.home || game.probablePitchers?.away) && (
        <div className="mt-1 text-xs text-neutral-500">
          SP: {game.probablePitchers?.away?.name || 'TBD'} vs {game.probablePitchers?.home?.name || 'TBD'}
        </div>
      )}
      {events.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-black/5 pt-2 text-xs text-neutral-600">
          {events.slice(0, 6).map((e) => (
            <li key={e.id}>
              <span className="font-medium">{eventLabel[e.type] || e.type}</span>
              {e.payload?.side ? ` (${e.payload.side})` : ''}
              {e.detectedAtIso ? ` · ${new Date(e.detectedAtIso).toLocaleTimeString()}` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CollectorHealth({ meta }) {
  if (!meta) {
    return <Note>Collector status not yet available (no snapshot has run since deploy, or off-day).</Note>;
  }
  const items = [
    ['Day', meta.day || '—'],
    ['Odds calls today', meta.oddsCalls ?? '—'],
    ['Bursts used', `${meta.burstsUsed ?? 0} / 3`],
    ['API credits left', meta.requestsRemaining ?? '—'],
    ['Last run', meta.lastRun ? new Date(meta.lastRun).toLocaleString() : '—'],
    ['Last poll', meta.lastPoll ? new Date(meta.lastPoll).toLocaleTimeString() : '—'],
  ];
  return (
    <div className="mb-6 rounded-xl border border-black/10 bg-neutral-50 p-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-500">Collector health</div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
        {items.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <span className="text-neutral-500">{k}</span>
            <span className="font-medium">{String(v)}</span>
          </div>
        ))}
      </div>
      {meta.lastError && <p className="mt-2 text-xs text-rose-600">Last error: {meta.lastError}</p>}
      {meta.lastRunNote && <p className="mt-1 text-xs text-neutral-500">{meta.lastRunNote}</p>}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Note({ children, tone }) {
  return (
    <p className={`rounded-lg border p-3 text-sm ${tone === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-black/10 bg-neutral-50 text-neutral-600'}`}>
      {children}
    </p>
  );
}
