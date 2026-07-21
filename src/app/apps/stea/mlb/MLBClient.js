'use client';

/*
 * MLB Line-Movement Study — read-only viewer (D-SITE-008).
 * Core question: does re-picking Over/Under at T-2h (using late info — confirmed
 * starters, latest market price) beat picking at the open? Correct-side accuracy
 * only — NOT a value/EV claim, no recommendation, no LLM.
 */

import { useEffect, useMemo, useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const ARCTURUSDC_TENANT_ID = 'FqhckqMaorJMAQ6B29mP';

// Clean study window. Line capture only reached full slate coverage on 2026-07-18;
// 07-16/17 games were finalized with no snapshots and can never be pick-graded, so
// the record and table begin here. Earlier finals are counted only as a muted total.
const STUDY_START_DATE = '2026-07-18';
// A non-final game whose first pitch is more than this far in the past is stuck
// (postponed/suspended, never re-reported Final) and is dropped from "Upcoming".
const STALE_UPCOMING_MS = 24 * 60 * 60 * 1000;

/* ── data load ─────────────────────────────────────────────────────────────── */
async function loadStudyData() {
  if (!db) throw new Error('Firebase client database is unavailable in this environment.');
  const tf = where('tenantId', '==', ARCTURUSDC_TENANT_ID);
  const [gamesSnap, metaDoc] = await Promise.all([
    getDocs(query(collection(db, 'mlb_games'), tf)),
    getDoc(doc(db, 'mlb_meta', 'collector')),
  ]);
  const games = gamesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const meta = metaDoc.exists() ? metaDoc.data() : null;
  return { games, meta };
}

/* ── helpers ───────────────────────────────────────────────────────────────── */
const fmtLine = (v) => (Number.isFinite(v) ? v.toFixed(1) : '—');
const pct = (n, d) => (d > 0 ? `${((n / d) * 100).toFixed(1)}%` : '—');
const hasPick = (p) => p && p.side != null;

function pitcherLabel(pitchers) {
  if (!pitchers) return 'SP not yet known';
  const away = pitchers.away?.name || 'TBD';
  const home = pitchers.home?.name || 'TBD';
  return `${away} vs ${home}`;
}

function PickCell({ pick }) {
  if (!pick) return <span className="text-neutral-400">—</span>;
  if (pick.push) return <span className="text-neutral-500">push</span>;
  return (
    <span className={pick.correct ? 'text-emerald-600' : 'text-rose-600'}>
      {pick.side} {fmtLine(pick.line)} ({pick.correct ? 'correct' : 'wrong'})
    </span>
  );
}

const revisionLabel = {
  unchanged: { text: 'unchanged', tone: 'text-neutral-500' },
  improved: { text: 'helped', tone: 'text-emerald-600 font-medium' },
  worsened: { text: 'hurt', tone: 'text-rose-600 font-medium' },
};

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
  const [state, setState] = useState({ status: 'loading', games: [], meta: null, error: null });

  useEffect(() => {
    let alive = true;
    loadStudyData()
      .then((data) => alive && setState({ status: 'ready', ...data, error: null }))
      .catch((err) => alive && setState({ status: 'error', games: [], meta: null, error: err.message }));
    return () => { alive = false; };
  }, []);

  const { pickGraded, excludedCount, upcoming } = useMemo(() => {
    const pg = [];
    let excluded = 0;
    const up = [];
    const staleBefore = Date.now() - STALE_UPCOMING_MS;
    for (const game of state.games) {
      const isFinal = game.status === 'final' || game.finalTotal != null;
      if (!isFinal) {
        // Drop games stuck non-final long past their first pitch (postponed/suspended
        // games MLB never re-reports as Final) so the Upcoming list stays truthful.
        const fp = game.scheduledFirstPitch ? Date.parse(game.scheduledFirstPitch) : NaN;
        if (Number.isFinite(fp) && fp < staleBefore) continue;
        up.push(game);
        continue;
      }
      // Clean study window only: a game counts toward the record if it was finalized
      // on/after STUDY_START_DATE (when line capture had full slate coverage) AND the
      // finalizer actually built a pick from a snapshot. Everything earlier is noise
      // (2026-07-16/17 finalized before line capture began) — see D-SITE-008 f/u 4.
      if (String(game.date || '') >= STUDY_START_DATE && (hasPick(game.openerPick) || hasPick(game.t2hPick))) {
        pg.push(game);
      } else {
        excluded++;
      }
    }
    pg.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    up.sort((a, b) => String(a.scheduledFirstPitch || '').localeCompare(String(b.scheduledFirstPitch || '')));
    return { pickGraded: pg, excludedCount: excluded, upcoming: up };
  }, [state.games]);

  const summary = useMemo(() => {
    let openerGraded = 0; let openerCorrect = 0;
    let t2hGraded = 0; let t2hCorrect = 0;
    let improved = 0; let worsened = 0; let unchanged = 0; let pitcherChanged = 0;
    for (const g of pickGraded) {
      const op = g.openerPick; const tp = g.t2hPick;
      if (op && !op.push && op.correct != null) { openerGraded++; if (op.correct) openerCorrect++; }
      if (tp && !tp.push && tp.correct != null) { t2hGraded++; if (tp.correct) t2hCorrect++; }
      if (g.revisionOutcome === 'improved') improved++;
      else if (g.revisionOutcome === 'worsened') worsened++;
      else if (g.revisionOutcome === 'unchanged') unchanged++;
      if (g.pitcherChangedBeforeT2h) pitcherChanged++;
    }
    return { openerGraded, openerCorrect, t2hGraded, t2hCorrect, improved, worsened, unchanged, pitcherChanged, total: pickGraded.length };
  }, [pickGraded]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-4">
        <p className="text-xs uppercase tracking-widest text-neutral-500">STEa · Research</p>
        <h1 className="text-3xl font-extrabold tracking-tight">MLB T-2h Pick Study</h1>
        <p className="mt-2 max-w-3xl text-sm text-neutral-600">
          For every game: the pick at the open, the pick ~2h before first pitch (using the latest
          market price and confirmed starters), and whether waiting to re-pick at T-2h beat picking
          at the open. Correct-side accuracy only — not a value/EV claim, no recommendation.
        </p>
      </header>

      {state.status === 'loading' && <Note>Loading study data…</Note>}
      {state.status === 'error' && <Note tone="error">Could not load data: {state.error}</Note>}

      {state.status === 'ready' && (
        <>
          <SummaryPanel s={summary} />
          <PickTable games={pickGraded} />
          {excludedCount > 0 && (
            <p className="mt-3 text-xs text-neutral-400">
              {excludedCount} earlier {excludedCount === 1 ? 'game' : 'games'} excluded — finalized before
              full line capture began on {STUDY_START_DATE}, so no opener/T-2h pick could be graded.
            </p>
          )}
          <UpcomingList games={upcoming} />
          <CollectorHealth meta={state.meta} />
        </>
      )}
    </main>
  );
}

function SummaryPanel({ s }) {
  return (
    <div className="mb-6 rounded-xl border border-black/10 bg-neutral-50 p-4">
      <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">
        Forward record · since {STUDY_START_DATE} ({s.total} pick-graded {s.total === 1 ? 'game' : 'games'})
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Opener pick" value={pct(s.openerCorrect, s.openerGraded)} sub={`${s.openerCorrect}/${s.openerGraded}`} />
        <Stat label="T-2h pick" value={pct(s.t2hCorrect, s.t2hGraded)} sub={`${s.t2hCorrect}/${s.t2hGraded}`} />
        <Stat label="Revision helped" value={s.improved} sub={`vs ${s.worsened} hurt, ${s.unchanged} unchanged`} tone={s.improved > s.worsened ? 'text-emerald-600' : s.improved < s.worsened ? 'text-rose-600' : ''} />
        <Stat label="Pitcher changed pre-T2h" value={s.pitcherChanged} sub={`of ${s.total} games`} />
      </div>
      <p className="mt-3 text-xs text-neutral-500">
        Sample is small — this is not yet statistically meaningful. Accumulates automatically each night.
      </p>
    </div>
  );
}

function Stat({ label, value, sub, tone }) {
  return (
    <div>
      <div className="text-xs text-neutral-500">{label}</div>
      <div className={`text-2xl font-bold ${tone || ''}`}>{value}</div>
      {sub && <div className="text-xs text-neutral-400">{sub}</div>}
    </div>
  );
}

function PickTable({ games }) {
  if (games.length === 0) {
    return <Note>No graded games yet — the finalizer runs nightly and backfills picks + results.</Note>;
  }
  return (
    <section className="mt-2">
      <h2 className="mb-3 text-xl font-bold">Picks vs actual</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500">
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3">Matchup</th>
              <th className="py-2 pr-3">SP at open</th>
              <th className="py-2 pr-3">SP at T-2h</th>
              <th className="py-2 pr-3 text-right">Opener pick</th>
              <th className="py-2 pr-3 text-right">T-2h pick</th>
              <th className="py-2 pr-3 text-right">Actual</th>
              <th className="py-2 pr-3 text-right">Revision</th>
            </tr>
          </thead>
          <tbody>
            {games.map((g) => {
              const rev = g.revisionOutcome ? revisionLabel[g.revisionOutcome] : null;
              return (
                <tr key={g.id} className="border-t border-black/5 align-top">
                  <td className="py-2 pr-3 text-neutral-500">{g.date}</td>
                  <td className="py-2 pr-3">{g.away} @ {g.home}</td>
                  <td className="py-2 pr-3 text-xs text-neutral-600">{pitcherLabel(g.pitchersAtOpener)}</td>
                  <td className="py-2 pr-3 text-xs text-neutral-600">
                    {pitcherLabel(g.pitchersAtT2h)}
                    {g.pitcherChangedBeforeT2h && <span className="ml-1 text-amber-600">(changed)</span>}
                  </td>
                  <td className="py-2 pr-3 text-right"><PickCell pick={g.openerPick} /></td>
                  <td className="py-2 pr-3 text-right"><PickCell pick={g.t2hPick} /></td>
                  <td className="py-2 pr-3 text-right font-semibold">{Number.isFinite(g.finalTotal) ? g.finalTotal : '—'}</td>
                  <td className={`py-2 pr-3 text-right ${rev ? rev.tone : 'text-neutral-400'}`}>{rev ? rev.text : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function UpcomingList({ games }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-xl font-bold">Upcoming ({games.length})</h2>
      {games.length === 0 ? (
        <Note>No upcoming games with lines captured yet.</Note>
      ) : (
        <div className="space-y-2">
          {games.map((g) => (
            <div key={g.id} className="rounded-lg border border-black/10 bg-white p-3 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium">{g.away} @ {g.home}</span>
                <span className="text-xs text-neutral-500">
                  {g.scheduledFirstPitch ? new Date(g.scheduledFirstPitch).toLocaleString() : 'TBD'}
                </span>
              </div>
              <div className="mt-1 text-xs text-neutral-500">{pitcherLabel(g.probablePitchers)}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function CollectorHealth({ meta }) {
  if (!meta) return null;
  const items = [
    ['Day', meta.day || '—'],
    ['Odds calls today', meta.oddsCalls ?? '—'],
    ['Bursts used', `${meta.burstsUsed ?? 0} / 3`],
    ['API credits left', meta.requestsRemaining ?? '—'],
    ['Last run', meta.lastRun ? new Date(meta.lastRun).toLocaleString() : '—'],
    ['Last poll', meta.lastPoll ? new Date(meta.lastPoll).toLocaleTimeString() : '—'],
  ];
  return (
    <details className="mt-8 rounded-xl border border-black/10 bg-neutral-50 p-4 text-sm">
      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-widest text-neutral-500">
        Collector health
      </summary>
      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
        {items.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <span className="text-neutral-500">{k}</span>
            <span className="font-medium">{String(v)}</span>
          </div>
        ))}
      </div>
      {meta.lastError && <p className="mt-2 text-xs text-rose-600">Last error: {meta.lastError}</p>}
    </details>
  );
}

function Note({ children, tone }) {
  return (
    <p className={`rounded-lg border p-3 text-sm ${tone === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-black/10 bg-neutral-50 text-neutral-600'}`}>
      {children}
    </p>
  );
}
