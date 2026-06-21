'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '@/lib/firebase';
import styles from './wc26.module.css';
import {
  buildMatch,
  buildMatchFromLambdas,
  priceAll,
  market1x2,
  marketDoubleChance,
  marketBTTS,
  marketTotals,
  marketTeamTotals,
  marketAsianHandicap,
  marketCorrectScore,
  devigMultiplicative,
  ev,
  kelly,
  gradeHistory,
  DEFAULTS,
} from './lib/engine';

const BLEND_WEIGHT = 0.5; // 50/50 Elo-model vs sharp-market lambdas

const SMALL_MARKETS = new Set(['Team Totals', 'BTTS', 'Totals', 'Correct Score']);
const isDangerZone = (o) => o >= 1.34 && o <= 1.5;

/* Build a priced match for a fixture, blending the Elo-model lambdas 50/50 with
 * the sharp-market-implied lambdas when available (else pure Elo model). */
function pricedMatchForFixture(fixture, ratings, opts) {
  const h = ratings[fixture.home];
  const a = ratings[fixture.away];
  if (!h || !a) return null;
  const model = buildMatch(h, a, { ...opts, neutral: fixture.neutral !== false });
  const ml = fixture.marketLambdas;
  if (ml && Number.isFinite(ml.lamHome) && Number.isFinite(ml.lamAway)) {
    const lamHome = BLEND_WEIGHT * ml.lamHome + (1 - BLEND_WEIGHT) * model.lamHome;
    const lamAway = BLEND_WEIGHT * ml.lamAway + (1 - BLEND_WEIGHT) * model.lamAway;
    return { match: buildMatchFromLambdas(lamHome, lamAway, opts), calibrated: true };
  }
  return { match: model, calibrated: false };
}

/* Calibrated value scan — mirrors engine.recommend() but prices each fixture off
 * the blended (Elo + sharp-market) matrix. Edge therefore comes from divergence
 * in the DERIVED markets, not from disagreeing with the sharp 1X2 line. */
function recommendCalibrated(fixtures, ratings, opts = {}) {
  const edgeMain = 0.03;
  const edgeSmall = 0.015;
  const bankroll = 100;
  const fair = (p) => (p <= 0 ? Infinity : 1 / p);
  const out = [];
  for (const f of fixtures || []) {
    const pm = pricedMatchForFixture(f, ratings, opts);
    if (!pm) continue;
    const priced = priceAll(pm.match);
    const odds = f.odds || {};
    for (const [sel, offered] of Object.entries(odds)) {
      if (!offered || offered <= 1) continue;
      let modelP = null, group = null;
      for (const [g, mkt] of Object.entries(priced)) if (mkt[sel]) { modelP = mkt[sel][0]; group = g; break; }
      if (modelP == null) continue;

      // Book's NO-VIG probability for this selection (devig against its market
      // siblings present in the odds map). Compare against this, not the vigged
      // price — strips the ~6.5% margin that inflated apparent edge.
      const bookNoVigP = noVigBookProb(sel, odds);
      // EV is still vs the price you actually take (that's what you're paid).
      const e = ev(modelP, offered);
      // |Δp| = honest probability disagreement, immune to longshot-odds magnification.
      const deltaP = bookNoVigP != null ? modelP - bookNoVigP : null;

      let thresh, flag = '';
      if (SMALL_MARKETS.has(group)) thresh = edgeSmall;
      else if (offered >= 6.0) { thresh = 0.1; flag = 'LONGSHOT — low confidence'; }
      else thresh = edgeMain;
      if (isDangerZone(offered) && (group === '1X2' || group === 'Asian Handicap')) flag = 'DANGER-ZONE FAV (fade)';
      // Price-magnified: a tiny probability disagreement dressed up as a big EV by
      // long odds. Flag regardless of how large the EV% looks.
      const priceMagnified = deltaP != null && Math.abs(deltaP) < 0.03;
      if (e >= thresh) {
        out.push({
          match: `${f.home} v ${f.away}`, group, selection: sel,
          modelProb: modelP, fairOdds: fair(modelP), offered,
          bookNoVigP, deltaP, priceMagnified,
          edge: e, stakeUnits: +(kelly(modelP, offered) * bankroll).toFixed(2),
          smallMarket: SMALL_MARKETS.has(group), flag, calibrated: pm.calibrated,
        });
      }
    }
  }
  // Rank by absolute probability disagreement |Δp|, NOT EV% (EV% is magnified by
  // long odds). Longshots and missing-Δp rows sink to the bottom.
  const isLongshot = (r) => r.flag.startsWith('LONGSHOT');
  const score = (r) => (r.deltaP == null ? -1 : Math.abs(r.deltaP));
  out.sort((p, q) => (isLongshot(p) - isLongshot(q)) || (score(q) - score(p)));
  return out;
}

// Market sibling groups for devig (selection keys must match engine market keys).
const DEVIG_GROUPS = [
  ['Home', 'Draw', 'Away'],
  ['Over 1.5', 'Under 1.5'],
  ['Over 2.5', 'Under 2.5'],
  ['Over 3.5', 'Under 3.5'],
  ['BTTS Yes', 'BTTS No'],
  ['Home Over 0.5', 'Home Under 0.5'],
  ['Home Over 1.5', 'Home Under 1.5'],
  ['Away Over 0.5', 'Away Under 0.5'],
  ['Away Over 1.5', 'Away Under 1.5'],
];

/* No-vig book probability for a selection, devigging against whichever siblings
 * the book actually quotes. Returns null if siblings aren't all present. */
function noVigBookProb(sel, odds) {
  const group = DEVIG_GROUPS.find((g) => g.includes(sel));
  if (!group) return null;
  const prices = group.map((s) => odds[s]);
  if (prices.some((p) => !p || p <= 1)) return null;
  const imp = prices.map((p) => 1 / p);
  const sum = imp.reduce((a, b) => a + b, 0);
  const idx = group.indexOf(sel);
  return imp[idx] / sum;
}
import seedRatings from './data/ratings.json';
import seedResults from './data/results.json';
import seedFixtures from './data/fixtures.json';

const LS_RATINGS = 'stea:wc26:ratings:v1';
const LS_BETS = 'stea:wc26:bets:v1';
const LS_BASE = 'stea:wc26:baseGoals:v1';
const ARCTURUSDC_TENANT_ID = 'FqhckqMaorJMAQ6B29mP';

const pct = (p) => `${(p * 100).toFixed(1)}%`;
const dec = (o) => (o === Infinity || !isFinite(o) ? '—' : o.toFixed(2));
const signed = (n) => `${n >= 0 ? '+' : ''}${(n * 100).toFixed(1)}%`;

/* localStorage helpers (SSR-safe — only touched in effects/handlers) */
function loadJSON(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function saveJSON(key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — ignore */
  }
}
function removeJSON(key) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* storage unavailable — ignore */
  }
}
function hasLocalJSON(key) {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

async function loadWorkspaceModelData() {
  if (!db) {
    throw new Error('Firebase client database is unavailable in this environment.');
  }

  const tenantFilter = where('tenantId', '==', ARCTURUSDC_TENANT_ID);
  const [teamsSnap, fixturesSnap, resultsSnap, predictionsSnap] = await Promise.all([
    getDocs(query(collection(db, 'wc26_teams'), tenantFilter)),
    getDocs(query(collection(db, 'wc26_fixtures'), tenantFilter)),
    getDocs(query(collection(db, 'wc26_results'), tenantFilter)),
    getDocs(query(collection(db, 'wc26_predictions'), tenantFilter)),
  ]);

  const remoteRatings = {};
  teamsSnap.forEach((doc) => {
    const data = doc.data();
    if (!data?.name || typeof data.atk !== 'number' || typeof data.dfn !== 'number') return;
    remoteRatings[data.name] = {
      atk: data.atk,
      dfn: data.dfn,
      tier: data.tier || 'Custom',
      gamesPlayed: typeof data.gamesPlayed === 'number' ? data.gamesPlayed : 0,
    };
  });

  const remoteFixtures = fixturesSnap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((fixture) => fixture?.home && fixture?.away && fixture.status !== 'final')
    .map((fixture) => ({
      matchId: fixture.matchId || fixture.id,
      home: fixture.home,
      away: fixture.away,
      neutral: fixture.neutral !== false,
      date: fixture.date || null,
      odds: fixture.odds || {},
      marketLambdas: fixture.marketLambdas || null,
    }));

  const remoteResults = resultsSnap.docs
    .map((doc) => doc.data())
    .filter((result) => (
      result?.home &&
      result?.away &&
      typeof result.g1 === 'number' &&
      typeof result.g2 === 'number'
    ))
    .map((result) => ({
      home: result.home,
      away: result.away,
      g1: result.g1,
      g2: result.g2,
      neutral: result.neutral !== false,
    }));

  // Forward track record: ONLY predictions that were logged pre-kickoff and
  // then graded against the real result. This is the honest scorecard.
  const gradedPredictions = predictionsSnap.docs
    .map((doc) => doc.data())
    .filter((p) => p?.grade && p.locked)
    .map((p) => ({
      match: `${p.home} v ${p.away}`,
      pick: p.grade.pick,
      pickProb: p.grade.pickProb,
      actual: p.grade.actual,
      score: p.grade.score,
      correct: p.grade.correct,
      brier1x2: p.grade.brier1x2,
    }));

  return {
    ratings: Object.keys(remoteRatings).length ? remoteRatings : null,
    fixtures: remoteFixtures.length ? remoteFixtures : null,
    results: remoteResults.length ? remoteResults : null,
    gradedPredictions,
  };
}

export default function WC26Client() {
  return (
    <Wc26AccessGate>
      <WC26Experience />
    </Wc26AccessGate>
  );
}

function Wc26AccessGate({ children }) {
  // Any signed-in STEa member passes — same pattern as Art Atlas and independent
  // of the *selected* workspace. The WC26 Firestore collections are tenant-scoped
  // to ArcturusDC and enforced by security rules server-side, so the client gate
  // does NOT need to require that specific tenant to be the active one. The old
  // "must be ArcturusDC workspace" check locked out valid members (incl. admins)
  // whenever isSuperAdmin hadn't resolved or another workspace was selected.
  const { availableTenants, loading: tenantLoading, error: tenantError, isSuperAdmin } = useTenant();
  const hasSteaAccess = isSuperAdmin || availableTenants.length > 0;

  if (tenantLoading) {
    return (
      <div className={styles.shell}>
        <main className={styles.accessPanel}>
          <p className={styles.kicker}>STEa Access</p>
          <h1 className={styles.accessTitle}>Checking access</h1>
          <p>Confirming your STEa membership before opening WC26.</p>
        </main>
      </div>
    );
  }

  if (!hasSteaAccess) {
    return (
      <div className={styles.shell}>
        <main className={styles.accessPanel}>
          <p className={styles.kicker}>STEa Access Required</p>
          <h1 className={styles.accessTitle}>WC26 xG Value Engine</h1>
          <p>
            This page is available to any signed-in STEa member, independent of the selected workspace.
            {tenantError ? ` Access lookup returned: ${tenantError}` : ' Sign in with an authorised account to continue.'}
          </p>
          <a className={styles.accessButton} href="/apps/stea?next=/apps/stea/wc26">
            Open STEa sign-in
          </a>
        </main>
      </div>
    );
  }

  return children;
}

function WC26Experience() {
  const { isSuperAdmin } = useTenant();
  /* --- shared model state --- */
  const [ratings, setRatings] = useState(seedRatings);
  const [fixtures, setFixtures] = useState(seedFixtures);
  const [results, setResults] = useState(seedResults);
  const [gradedPredictions, setGradedPredictions] = useState([]);
  const [baseGoals, setBaseGoals] = useState(DEFAULTS.baseGoals);
  const [hydrated, setHydrated] = useState(false);
  const [hasLocalRatings, setHasLocalRatings] = useState(false);
  const [dataStatus, setDataStatus] = useState({
    tone: 'local',
    text: 'Using committed fallback data until Firestore workspace data is available.',
  });

  useEffect(() => {
    const localRatingsExist = hasLocalJSON(LS_RATINGS);
    setHasLocalRatings(localRatingsExist);
    setRatings(loadJSON(LS_RATINGS, seedRatings));
    setBaseGoals(loadJSON(LS_BASE, DEFAULTS.baseGoals));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return undefined;

    let active = true;
    async function loadRemote() {
      setDataStatus({ tone: 'loading', text: 'Loading ArcturusDC workspace data from Firestore...' });
      try {
        const remote = await loadWorkspaceModelData();
        if (!active) return;

        if (remote.fixtures) setFixtures(remote.fixtures);
        if (remote.results) setResults(remote.results);
        if (remote.ratings && !hasLocalRatings) setRatings(remote.ratings);
        setGradedPredictions(remote.gradedPredictions || []);

        const parts = [
          remote.ratings ? `${Object.keys(remote.ratings).length} teams` : 'fallback teams',
          remote.fixtures ? `${remote.fixtures.length} fixtures` : 'fallback fixtures',
          remote.results ? `${remote.results.length} results` : 'fallback results',
        ];
        setDataStatus({
          tone: hasLocalRatings ? 'local' : 'live',
          text: `Workspace Firestore sync loaded: ${parts.join(' · ')}.${hasLocalRatings ? ' Local rating overrides are active.' : ''}`,
        });
      } catch (err) {
        console.error('[WC26] Firestore workspace sync failed', err);
        if (!active) return;
        setDataStatus({
          tone: 'error',
          text: `Firestore sync unavailable: ${err.message || 'unknown error'}. Using committed fallback data.`,
        });
      }
    }

    loadRemote();
    return () => {
      active = false;
    };
  }, [hydrated, hasLocalRatings]);

  const opts = useMemo(() => ({ baseGoals }), [baseGoals]);

  return (
    <div className={styles.shell}>
      <div className={styles.inner}>
        <Header />
        <BaseGoalsControl baseGoals={baseGoals} setBaseGoals={(v) => { setBaseGoals(v); saveJSON(LS_BASE, v); }} />
        <DataStatus status={dataStatus} />
        <RefreshData isSuperAdmin={isSuperAdmin} />
        <Recommendation ratings={ratings} fixtures={fixtures} opts={opts} />
        <OddsEntry isSuperAdmin={isSuperAdmin} fixtures={fixtures} />
        <MatchPricer ratings={ratings} opts={opts} />
        <ValueCalculator ratings={ratings} opts={opts} hydrated={hydrated} />
        <TrackRecord ratings={ratings} results={results} gradedPredictions={gradedPredictions} opts={opts} />
        <RatingsEditor
          ratings={ratings}
          setRatings={(r) => { setRatings(r); setHasLocalRatings(true); saveJSON(LS_RATINGS, r); }}
          resetRatings={() => { setRatings(seedRatings); setHasLocalRatings(false); removeJSON(LS_RATINGS); }}
        />
        <Footer />
      </div>
    </div>
  );
}

function DataStatus({ status }) {
  return (
    <section className={`${styles.statusCard} ${styles[`status_${status.tone}`] || ''}`}>
      <span>Data source</span>
      <p>{status.text}</p>
    </section>
  );
}

/* Super-admin only: pull REAL results/fixtures from the pinned source, then
 * trigger the deterministic rating refit + prediction sync. No LLM, no odds. */
function RefreshData({ isSuperAdmin }) {
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState(null);

  if (!isSuperAdmin) return null;

  async function refresh() {
    setBusy(true);
    setReport({ tone: 'loading', text: 'Fetching real results/fixtures from openfootball (no LLM)…' });
    try {
      const res = await fetch('/api/stea/wc26/ingest', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || `Ingest failed (${res.status})`);

      setReport({ tone: 'loading', text: `Wrote ${data.resultsWritten} results · ${data.fixturesWritten} fixtures. Updating ratings…` });
      const fns = getFunctions();
      await httpsCallable(fns, 'refitWc26RatingsNow')({});
      await httpsCallable(fns, 'syncWc26PredictionsNow')({});

      const missing = data.missingPriorTeams?.length
        ? ` · ${data.missingPriorTeams.length} team(s) without ratings skipped: ${data.missingPriorTeams.join(', ')}`
        : '';
      setReport({
        tone: 'live',
        text: `Done. ${data.resultsWritten} results · ${data.fixturesWritten} fixtures written from openfootball; ratings refit + predictions synced. Reload to see updates.${missing}`,
      });
    } catch (err) {
      setReport({ tone: 'error', text: `Refresh failed: ${err.message || 'unknown error'}.` });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`${styles.statusCard} ${report ? styles[`status_${report.tone}`] || '' : ''}`}>
      <span>Admin · live data</span>
      <p style={{ flex: 1 }}>
        {report
          ? report.text
          : 'Pull real completed results + fixtures from the pinned source (openfootball, CC0) and update the model. Results only — odds are entered separately.'}
      </p>
      <button className={styles.ghostBtn} onClick={refresh} disabled={busy}>
        {busy ? 'Refreshing…' : 'Refresh results & ratings'}
      </button>
    </section>
  );
}

/* ---------------------------------------------------------------- header */
function Header() {
  return (
    <header className={styles.header}>
      <p className={styles.kicker}>STEa · Modelling</p>
      <h1 className={styles.title}>WC26 xG Value Engine</h1>
      <p className={styles.lede}>
        A deterministic Dixon-Coles / expected-goals pricer for the 2026 World Cup. Every market is
        summed off one scoreline grid, so the prices can never contradict each other.{' '}
        <strong>No LLM ever touches the prediction path</strong> — the maths picks; you bring the
        odds.
      </p>
    </header>
  );
}

/* ----------------------------------------------------------- base goals */
function BaseGoalsControl({ baseGoals, setBaseGoals }) {
  return (
    <section className={`${styles.card} ${styles.baseCard}`}>
      <div>
        <span className={styles.cardLabel}>base goals</span>
        <strong className={styles.baseVal}>{baseGoals.toFixed(2)}</strong>
        <span className={styles.baseHint}>≈ {(baseGoals * 2).toFixed(2)} goals/game</span>
      </div>
      <input
        type="range"
        min="1.15"
        max="1.40"
        step="0.01"
        value={baseGoals}
        onChange={(e) => setBaseGoals(parseFloat(e.target.value))}
        className={styles.slider}
        aria-label="Base goals calibration"
      />
      <p className={styles.note}>
        Default <b>1.25</b> = the historical WC group-stage rate (~2.5 goals/game). Nudge to{' '}
        <b>1.30–1.35</b> for open knockout ties. This is the one calibration knob — extremes are not
        free accuracy.
      </p>
    </section>
  );
}

/* Discoverable, touch-friendly explanation of the confidence badges. */
function ConfidenceInfo() {
  const [open, setOpen] = useState(false);
  return (
    <span className={styles.infoWrap}>
      <button
        type="button"
        className={styles.infoBtn}
        aria-label="What do the confidence badges mean?"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        i
      </button>
      {open && (
        <div className={styles.infoPop} role="dialog">
          <p><b>Confidence is not the size of the edge.</b> With coarse ratings, a huge edge usually means the model disagrees with the market — a red flag, not a tip.</p>
          <ul>
            <li><span className={`${styles.confBadge} ${styles.confHigh}`}>High / Higher</span> Plausible edge, both teams&apos; ratings grounded in ≥3 played games (small markets favoured).</li>
            <li><span className={`${styles.confBadge} ${styles.confMid}`}>Modest / Fair</span> Plausible edge, but ratings still building from few games.</li>
            <li><span className={`${styles.confBadge} ${styles.confLow}`}>Low</span> A team has 0 played games (unverified tier guess), the edge is implausibly large (likely miscalibration), or it&apos;s a longshot.</li>
            <li><span className={`${styles.confBadge} ${styles.confFade}`}>Fade</span> Danger-zone favourite — surfaced as a fade, not a follow.</li>
          </ul>
          <p className={styles.muted}>Confidence builds as real games are played and ratings calibrate. Hover any badge for its specific reason.</p>
        </div>
      )}
    </span>
  );
}

/* -------------------------------------------------------- recommendation */
function tagClass(flag) {
  if (!flag) return '';
  if (flag.startsWith('LONGSHOT')) return styles.tagLongshot;
  if (flag.startsWith('DANGER')) return styles.tagDanger;
  return styles.tagNeutral;
}

/*
 * Honest confidence badge. Confidence is NOT the size of the edge — with coarse
 * ratings a huge edge just means the model disagrees wildly with the market,
 * which is a LOW-confidence red flag. The primary driver is how GROUNDED the two
 * teams' ratings are: a rating shaped by real games is worth more than a tier
 * guess. Confidence therefore starts low for seed-only teams and BUILDS UP as
 * games are played (gamesPlayed → shrinkage moves rating from prior to data).
 *
 * `ratings` may be undefined (fallback seed) — then we can't read gamesPlayed and
 * fall back to flag/edge/market signals only.
 */
function confidenceBadge(row, ratings) {
  // Engine flags always dominate.
  if (row.flag && row.flag.startsWith('LONGSHOT')) {
    return { label: 'Low', cls: styles.confLow, why: 'Longshot — coarse models over-rate these.' };
  }
  if (row.flag && row.flag.startsWith('DANGER')) {
    return { label: 'Fade', cls: styles.confFade, why: 'Danger-zone favourite — surfaced as a fade, not a follow.' };
  }
  // Price-magnified: |Δp| < 3pp — a rounding-error disagreement dressed up as a big
  // EV by long odds. Always Low, regardless of headline edge.
  if (row.priceMagnified) {
    return { label: 'Low', cls: styles.confLow, why: `Only ${(Math.abs(row.deltaP) * 100).toFixed(1)}pp from the book's no-vig price — the big edge is long-odds magnification, not real disagreement.` };
  }

  // How grounded are the ratings behind this pick? Fewest games of the two teams.
  const [home, away] = (row.match || '').split(' v ');
  const gh = ratings?.[home]?.gamesPlayed;
  const ga = ratings?.[away]?.gamesPlayed;
  const minGames = (typeof gh === 'number' && typeof ga === 'number') ? Math.min(gh, ga) : null;

  // A team with 0 observed games is a pure tier guess — anything involving it is
  // low confidence regardless of the edge.
  if (minGames === 0) {
    return { label: 'Low', cls: styles.confLow, why: 'One team has no played games — its rating is an unverified tier guess.' };
  }

  // Implausibly large edges signal miscalibration, not opportunity. A calibrated
  // (sharp-market-blended) price earns more trust at a given edge than a pure-Elo
  // one, but a huge edge is still a red flag either way.
  const bigEdge = row.calibrated ? 0.15 : 0.12;
  if (row.edge >= 0.30) {
    return { label: 'Low', cls: styles.confLow, why: 'Edge too large to be real — likely miscalibration vs the market.' };
  }
  if (row.edge >= bigEdge) {
    return { label: 'Modest', cls: styles.confMid, why: row.calibrated ? 'Sizeable edge vs the sharp line — treat with care.' : 'Large edge but not market-calibrated — caution.' };
  }
  if (!row.calibrated) {
    return { label: 'Modest', cls: styles.confMid, why: 'No sharp-market line to calibrate against — priced off ratings only.' };
  }

  // Plausible edge. Confidence builds with games behind the ratings; small
  // markets get a bump (books shade them least).
  if (minGames !== null && minGames >= 3) {
    return row.smallMarket
      ? { label: 'High', cls: styles.confHigh, why: 'Plausible edge, ratings grounded in ≥3 games each, small market.' }
      : { label: 'Higher', cls: styles.confHigh, why: 'Plausible edge with ratings grounded in ≥3 games each.' };
  }
  if (row.smallMarket) {
    return { label: 'Modest', cls: styles.confMid, why: 'Plausible edge in a small market, but ratings still building (few games).' };
  }
  return { label: 'Fair', cls: styles.confMid, why: 'Plausible edge; ratings still building from limited games.' };
}

// Only these badge labels are trustworthy enough to headline.
const PLAUSIBLE_LABELS = new Set(['High', 'Higher', 'Modest', 'Fair']);

function Recommendation({ ratings, fixtures, opts }) {
  const ranked = useMemo(() => recommendCalibrated(fixtures, ratings, opts), [fixtures, ratings, opts]);
  const anyOdds = useMemo(
    () => (fixtures || []).some((f) => f.odds && Object.keys(f.odds).length),
    [fixtures],
  );
  // Headline the best PLAUSIBLE-confidence pick, not the biggest (likely
  // miscalibrated) edge. Small markets already sort first within the engine.
  const top = useMemo(
    () => ranked.find((r) => PLAUSIBLE_LABELS.has(confidenceBadge(r, ratings).label)) || null,
    [ranked, ratings],
  );

  return (
    <section className={styles.card}>
      <h2 className={styles.h2}>Bet of the day <ConfidenceInfo /></h2>
      {!top ? (
        !anyOdds ? (
          <p className={styles.empty}>
            No value bet to show. Recommendations need book odds against the upcoming fixtures — pull
            them with <b>Pull live odds</b> or add them in <b>Enter odds</b> below (no odds = no edge
            to compute). The model prices every match regardless; it just can&apos;t find
            <em> value</em> without a price to compare against.
          </p>
        ) : (
          <p className={styles.empty}>
            <b>No confident bet today.</b> Every current edge is Low confidence — the model disagrees
            with the market by an implausible margin, which means the ratings are miscalibrated, not
            that there&apos;s value. Better to pass than to back a fantasy edge. The full board is
            below for transparency; confidence builds as games are played and ratings calibrate.
          </p>
        )
      ) : (
        <div className={styles.hero}>
          <div className={styles.heroLine}>
            <span className={styles.heroMatch}>{top.match}</span>
            <span className={styles.heroSel}>{top.selection}</span>
            <span className={styles.heroOdds}>@ {dec(top.offered)}</span>
          </div>
          <div className={styles.heroStats}>
            <span>Model fair <b>{dec(top.fairOdds)}</b></span>
            <span className={styles.edgePos}>edge {signed(top.edge)}</span>
            {(() => { const c = confidenceBadge(top, ratings); return <span className={`${styles.confBadge} ${c.cls}`} title={c.why}>{c.label} confidence</span>; })()}
            <span>stake <b>{top.stakeUnits}u</b> <em>(¼-Kelly, 100u bank)</em></span>
          </div>
          {top.smallMarket && (
            <p className={styles.heroFlag}>Small market — books shade these least.</p>
          )}
          {top.flag && <p className={`${styles.heroFlag} ${tagClass(top.flag)}`}>{top.flag}</p>}
        </div>
      )}

      {ranked.length > 0 && (
        <>
          <h3 className={styles.h3}>Ranked value board</h3>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Match</th><th>Market</th><th>Selection</th>
                  <th className={styles.num}>Offered</th><th className={styles.num}>Fair</th>
                  <th className={styles.num} title="Absolute probability disagreement vs the book's no-vig price — the honest edge measure">|Δp|</th>
                  <th className={styles.num}>Edge</th><th>Confidence</th><th className={styles.num}>Stake</th><th>Flag</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((r, i) => {
                  const c = confidenceBadge(r, ratings);
                  return (
                  <tr key={i}>
                    <td>{r.match}</td><td className={styles.muted}>{r.group}</td><td>{r.selection}</td>
                    <td className={styles.num}>{dec(r.offered)}</td>
                    <td className={styles.num}>{dec(r.fairOdds)}</td>
                    <td className={styles.num}>{r.deltaP == null ? '—' : `${(Math.abs(r.deltaP) * 100).toFixed(1)}pp`}</td>
                    <td className={`${styles.num} ${r.priceMagnified ? styles.muted : styles.edgePos}`}>{signed(r.edge)}</td>
                    <td><span className={`${styles.confBadge} ${c.cls}`} title={c.why}>{c.label}</span></td>
                    <td className={styles.num}>{r.stakeUnits}u</td>
                    <td>{r.flag && <span className={`${styles.tag} ${tagClass(r.flag)}`}>{r.flag}</span>}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

/* -------------------------------------------------------- odds entry (admin) */
const ODDS_FIELDS = [
  'Home', 'Draw', 'Away',
  'Over 2.5', 'Under 2.5', 'BTTS Yes', 'BTTS No',
  'Home Over 1.5', 'Away Over 0.5',
];

function OddsEntry({ isSuperAdmin, fixtures }) {
  const upcoming = useMemo(
    () => (fixtures || []).filter((f) => f.matchId).sort((a, b) => (a.date || '').localeCompare(b.date || '')),
    [fixtures],
  );
  const [matchId, setMatchId] = useState('');
  const [values, setValues] = useState({});
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [pullStatus, setPullStatus] = useState(null);

  if (!isSuperAdmin) return null;

  async function pullLiveOdds() {
    setPulling(true);
    setPullStatus({ tone: 'loading', text: 'Pulling live odds from The Odds API (no LLM)…' });
    try {
      const res = await fetch('/api/stea/wc26/odds-api', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || `Failed (${res.status})`);
      const um = data.unmatched?.length ? ` · ${data.unmatched.length} unmatched fixtures` : '';
      setPullStatus({
        tone: 'live',
        text: `Wrote consensus odds to ${data.written} fixture(s); ${data.rejectedCount} rejected (suspended/in-play)${um}. ${data.requestsRemaining ?? '?'} API requests left this month. Reload to see the value board.`,
      });
    } catch (err) {
      setPullStatus({ tone: 'error', text: `Live odds failed: ${err.message}` });
    } finally {
      setPulling(false);
    }
  }

  const selected = upcoming.find((f) => f.matchId === matchId) || upcoming[0];
  const activeId = selected?.matchId || '';

  async function submit() {
    if (!activeId) return;
    const odds = {};
    for (const [k, v] of Object.entries(values)) {
      const n = parseFloat(v);
      if (n > 1) odds[k] = n;
    }
    if (!Object.keys(odds).length) { setStatus({ tone: 'error', text: 'Enter at least one decimal odd > 1.0.' }); return; }
    setBusy(true);
    setStatus({ tone: 'loading', text: 'Writing odds…' });
    try {
      const res = await fetch('/api/stea/wc26/odds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: activeId, odds, source: 'manual' }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || `Failed (${res.status})`);
      const rej = data.rejected?.length ? ` · ${data.rejected.length} rejected` : '';
      setStatus({ tone: 'live', text: `Wrote ${data.written} odd(s) for ${activeId}${rej}. Reload to see recommendations update.` });
      setValues({});
    } catch (err) {
      setStatus({ tone: 'error', text: `Failed: ${err.message}` });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.card}>
      <h2 className={styles.h2}>Odds <span className={styles.muted}>· admin — feeds the value board</span></h2>
      <p className={styles.note}>
        Odds are <b>not a model input</b> — they only let the engine compute <em>value</em> (model
        fair price vs the book). Pull live consensus odds from The Odds API (a real REST feed for
        upcoming matches — no LLM, nothing to fabricate; suspended/in-play prices are auto-rejected),
        or type prices in by hand below. The value board appears once odds exist.
      </p>
      <div className={styles.editorActions}>
        <button className={styles.ghostBtn} onClick={pullLiveOdds} disabled={pulling}>
          {pulling ? 'Pulling…' : 'Pull live odds (The Odds API)'}
        </button>
        {pullStatus && (
          <span className={pullStatus.tone === 'error' ? styles.edgeNeg : styles.muted} style={{ alignSelf: 'center' }}>
            {pullStatus.text}
          </span>
        )}
      </div>
      {upcoming.length === 0 ? (
        <p className={styles.empty}>No upcoming fixtures loaded.</p>
      ) : (
        <>
          <div className={styles.controls}>
            <label className={styles.field}>
              <span>Fixture</span>
              <select value={activeId} onChange={(e) => { setMatchId(e.target.value); setValues({}); setStatus(null); }}>
                {upcoming.map((f) => (
                  <option key={f.matchId} value={f.matchId}>
                    {f.date ? `${f.date} · ` : ''}{f.home} v {f.away}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className={styles.marketGrid}>
            {ODDS_FIELDS.map((sel) => (
              <label key={sel} className={styles.field}>
                <span>{sel}</span>
                <input
                  className={styles.oddsInput} type="number" step="0.01" min="1.01" placeholder="—"
                  value={values[sel] ?? ''}
                  onChange={(e) => setValues({ ...values, [sel]: e.target.value })}
                />
              </label>
            ))}
          </div>
          <div className={styles.editorActions}>
            <button className={styles.ghostBtn} onClick={submit} disabled={busy}>
              {busy ? 'Saving…' : 'Save odds'}
            </button>
            {status && <span className={status.tone === 'error' ? styles.edgeNeg : styles.muted} style={{ alignSelf: 'center' }}>{status.text}</span>}
          </div>
        </>
      )}
    </section>
  );
}

/* ------------------------------------------------------------ match pricer */
const MARKET_ORDER = [
  '1X2', 'Double Chance', 'Totals', 'Team Totals', 'BTTS', 'Asian Handicap', 'Correct Score',
];

function MatchPricer({ ratings, opts }) {
  const teams = useMemo(() => Object.keys(ratings).sort(), [ratings]);
  const [home, setHome] = useState('Brazil');
  const [away, setAway] = useState('Morocco');
  const [hostVenue, setHostVenue] = useState(false);

  const priced = useMemo(() => {
    const h = ratings[home], a = ratings[away];
    if (!h || !a) return null;
    const m = buildMatch(h, a, { ...opts, neutral: !hostVenue, homeAdv: 1.25 });
    return { m, all: priceAll(m) };
  }, [ratings, home, away, hostVenue, opts]);

  return (
    <section className={styles.card}>
      <h2 className={styles.h2}>Match pricer</h2>
      <div className={styles.controls}>
        <label className={styles.field}>
          <span>Home</span>
          <select value={home} onChange={(e) => setHome(e.target.value)}>
            {teams.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <span className={styles.vs}>v</span>
        <label className={styles.field}>
          <span>Away</span>
          <select value={away} onChange={(e) => setAway(e.target.value)}>
            {teams.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label className={styles.toggle}>
          <input type="checkbox" checked={hostVenue} onChange={(e) => setHostVenue(e.target.checked)} />
          <span>Host venue (home adv. ×1.25)</span>
        </label>
      </div>

      {priced && (
        <>
          <p className={styles.xgLine}>
            xG line: <b>{priced.m.lamHome.toFixed(2)}</b> – <b>{priced.m.lamAway.toFixed(2)}</b>{' '}
            <span className={styles.muted}>(expected total {priced.m.expTotal.toFixed(2)})</span>
          </p>
          <div className={styles.marketGrid}>
            {MARKET_ORDER.map((group) => (
              <div key={group} className={styles.marketBlock}>
                <h4 className={styles.h4}>{group}</h4>
                <ul className={styles.priceList}>
                  {Object.entries(priced.all[group]).map(([sel, [p, fairOdds]]) => (
                    <li key={sel}>
                      <span className={styles.sel}>{sel}</span>
                      <span className={styles.muted}>{pct(p)}</span>
                      <span className={styles.fairOdds}>{dec(fairOdds)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/* -------------------------------------------------------- value calculator */
function ValueCalculator({ ratings, opts, hydrated }) {
  const teams = useMemo(() => Object.keys(ratings).sort(), [ratings]);
  const [home, setHome] = useState('Brazil');
  const [away, setAway] = useState('Morocco');
  const [hostVenue, setHostVenue] = useState(false);
  const [bookOdds, setBookOdds] = useState({}); // selection -> string
  const [bets, setBets] = useState([]);

  useEffect(() => { if (hydrated) setBets(loadJSON(LS_BETS, [])); }, [hydrated]);

  const priced = useMemo(() => {
    const h = ratings[home], a = ratings[away];
    if (!h || !a) return null;
    const m = buildMatch(h, a, { ...opts, neutral: !hostVenue, homeAdv: 1.25 });
    return priceAll(m);
  }, [ratings, home, away, hostVenue, opts]);

  // flat list of {group, sel, p} for the calculator rows
  const rows = useMemo(() => {
    if (!priced) return [];
    const r = [];
    for (const group of MARKET_ORDER) {
      for (const [sel, [p]] of Object.entries(priced[group])) r.push({ group, sel, p });
    }
    return r;
  }, [priced]);

  // 1X2 devig display (the book's no-vig opinion)
  const devig = useMemo(() => {
    const o = ['Home', 'Draw', 'Away'].map((k) => parseFloat(bookOdds[k]));
    if (o.some((v) => !v || v <= 1)) return null;
    const noVig = devigMultiplicative(o);
    const overround = o.reduce((s, v) => s + 1 / v, 0);
    return { noVig, overround };
  }, [bookOdds]);

  function logBet(group, sel, offered, modelP) {
    const entry = {
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      match: `${home} v ${away}`,
      market: group,
      selection: sel,
      oddsTaken: offered,
      closingOdds: null,
      stake: +(kelly(modelP, offered) * 100).toFixed(2),
      result: 'pending',
    };
    const next = [entry, ...bets];
    setBets(next); saveJSON(LS_BETS, next);
  }

  function updateBet(id, patch) {
    const next = bets.map((b) => (b.id === id ? { ...b, ...patch } : b));
    setBets(next); saveJSON(LS_BETS, next);
  }
  function removeBet(id) {
    const next = bets.filter((b) => b.id !== id);
    setBets(next); saveJSON(LS_BETS, next);
  }

  const clv = (b) =>
    b.closingOdds && b.oddsTaken ? b.oddsTaken / b.closingOdds - 1 : null;
  const settled = bets.filter((b) => clv(b) !== null);
  const avgClv = settled.length
    ? settled.reduce((s, b) => s + clv(b), 0) / settled.length
    : null;
  const beatClose = settled.length
    ? settled.filter((b) => clv(b) > 0).length / settled.length
    : null;

  return (
    <section className={styles.card}>
      <h2 className={styles.h2}>Value calculator</h2>
      <p className={styles.note}>
        Price a match, then type the book odds you can see. Green = model thinks it's +EV. Devig
        shows the book&apos;s true (no-vig) opinion next to the model&apos;s.
      </p>

      <div className={styles.controls}>
        <label className={styles.field}>
          <span>Home</span>
          <select value={home} onChange={(e) => { setHome(e.target.value); setBookOdds({}); }}>
            {teams.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <span className={styles.vs}>v</span>
        <label className={styles.field}>
          <span>Away</span>
          <select value={away} onChange={(e) => { setAway(e.target.value); setBookOdds({}); }}>
            {teams.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label className={styles.toggle}>
          <input type="checkbox" checked={hostVenue} onChange={(e) => setHostVenue(e.target.checked)} />
          <span>Host venue</span>
        </label>
      </div>

      {devig && (
        <p className={styles.devig}>
          Book overround <b>{(devig.overround * 100).toFixed(1)}%</b> · no-vig 1X2{' '}
          <b>{devig.noVig.map((p) => pct(p)).join(' / ')}</b>
        </p>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Market</th><th>Selection</th>
              <th className={styles.num}>Model</th><th className={styles.num}>Fair</th>
              <th>Your odds</th><th className={styles.num}>EV</th>
              <th className={styles.num}>Stake</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ group, sel, p }) => {
              const offered = parseFloat(bookOdds[sel]);
              const valid = offered && offered > 1;
              const e = valid ? ev(p, offered) : null;
              const stake = valid ? +(kelly(p, offered) * 100).toFixed(2) : null;
              return (
                <tr key={`${group}-${sel}`}>
                  <td className={styles.muted}>{group}</td>
                  <td>{sel}</td>
                  <td className={styles.num}>{pct(p)}</td>
                  <td className={styles.num}>{dec(1 / p)}</td>
                  <td>
                    <input
                      className={styles.oddsInput}
                      type="number" step="0.01" min="1.01" placeholder="—"
                      value={bookOdds[sel] ?? ''}
                      onChange={(ev2) => setBookOdds({ ...bookOdds, [sel]: ev2.target.value })}
                    />
                  </td>
                  <td className={`${styles.num} ${valid ? (e > 0 ? styles.edgePos : styles.edgeNeg) : ''}`}>
                    {valid ? signed(e) : '—'}
                  </td>
                  <td className={styles.num}>{valid && stake > 0 ? `${stake}u` : '—'}</td>
                  <td>
                    {valid && e > 0 && (
                      <button className={styles.logBtn} onClick={() => logBet(group, sel, offered, p)}>
                        Log
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* user bet log — the real scorecard */}
      <h3 className={styles.h3}>Your bet log <span className={styles.muted}>· CLV is the real scorecard</span></h3>
      {settled.length > 0 && (
        <div className={styles.clvTiles}>
          <div className={styles.tile}>
            <span className={styles.tileNum} style={{ color: avgClv >= 0 ? 'var(--wc-pos)' : 'var(--wc-neg)' }}>
              {signed(avgClv)}
            </span>
            <span className={styles.tileLabel}>avg CLV</span>
          </div>
          <div className={styles.tile}>
            <span className={styles.tileNum}>{(beatClose * 100).toFixed(0)}%</span>
            <span className={styles.tileLabel}>beat the close</span>
          </div>
          <div className={styles.tile}>
            <span className={styles.tileNum}>{settled.length}/{bets.length}</span>
            <span className={styles.tileLabel}>settled / logged</span>
          </div>
        </div>
      )}
      {bets.length === 0 ? (
        <p className={styles.empty}>No bets logged yet. Click <b>Log</b> on a +EV row above, then add the closing odds later.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th><th>Match</th><th>Selection</th>
                <th className={styles.num}>Taken</th><th>Closing</th>
                <th className={styles.num}>CLV</th><th>Result</th><th></th>
              </tr>
            </thead>
            <tbody>
              {bets.map((b) => {
                const c = clv(b);
                return (
                  <tr key={b.id}>
                    <td className={styles.muted}>{b.date}</td>
                    <td>{b.match}</td>
                    <td>{b.selection}</td>
                    <td className={styles.num}>{dec(b.oddsTaken)}</td>
                    <td>
                      <input
                        className={styles.oddsInput} type="number" step="0.01" min="1.01" placeholder="—"
                        value={b.closingOdds ?? ''}
                        onChange={(e) => updateBet(b.id, { closingOdds: parseFloat(e.target.value) || null })}
                      />
                    </td>
                    <td className={`${styles.num} ${c == null ? '' : c >= 0 ? styles.edgePos : styles.edgeNeg}`}>
                      {c == null ? '—' : signed(c)}
                    </td>
                    <td>
                      <select value={b.result} onChange={(e) => updateBet(b.id, { result: e.target.value })}>
                        <option value="pending">pending</option>
                        <option value="won">won</option>
                        <option value="lost">lost</option>
                        <option value="void">void</option>
                      </select>
                    </td>
                    <td><button className={styles.delBtn} onClick={() => removeBet(b.id)}>×</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className={styles.note}>
        Over ~48 games, win/loss is noise. If your average CLV is positive you have an edge — even on
        a losing run. If it isn&apos;t, no hot streak is real.
      </p>
    </section>
  );
}

/* ------------------------------------------------------------ track record */
function TrackRecord({ ratings, results, gradedPredictions, opts }) {
  // In-sample backtest — honest label: NOT a track record (grades the model on
  // the same games whose results shaped its ratings).
  const backtest = useMemo(() => gradeHistory(results, ratings, opts), [results, ratings, opts]);
  const b = backtest.summary;

  // Forward record — the genuine scorecard: predictions logged BEFORE kickoff,
  // graded after the real result. Starts empty and grows honestly.
  const fwd = useMemo(() => {
    const rows = gradedPredictions || [];
    const n = rows.length;
    if (!n) return { n: 0 };
    const hit1x2 = rows.filter((r) => r.correct).length;
    const brier = rows.reduce((s, r) => s + (r.brier1x2 ?? 0), 0) / n;
    return { n, acc1x2: hit1x2 / n, brier, rows };
  }, [gradedPredictions]);

  return (
    <section className={styles.card}>
      <h2 className={styles.h2}>Model track record</h2>

      {/* FORWARD RECORD — the honest one */}
      <h3 className={styles.h3}>Forward record <span className={styles.muted}>· predictions logged before kickoff, graded after the result</span></h3>
      {fwd.n === 0 ? (
        <p className={styles.empty}>
          <b>No graded forward predictions yet.</b> This is the only honest scorecard — it counts
          only bets the model called <em>before</em> kickoff, then graded against the real result.
          It starts at zero and grows as upcoming games complete. (You cannot honestly build a track
          record from games that have already finished.)
        </p>
      ) : (
        <>
          <div className={styles.clvTiles}>
            <Tile num={pct(fwd.acc1x2)} label="1X2 strike rate (forward)" />
            <Tile num={fwd.brier.toFixed(3)} label="Brier (uniform = 0.667)" />
            <Tile num={String(fwd.n)} label="predictions graded" />
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr><th>Match</th><th>Pre-kickoff pick</th><th className={styles.num}>Conf.</th><th>Result</th><th className={styles.num}>1X2</th></tr>
              </thead>
              <tbody>
                {fwd.rows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.match}</td><td>{r.pick}</td>
                    <td className={styles.num}>{pct(r.pickProb)}</td>
                    <td className={styles.muted}>{r.score} ({r.actual})</td>
                    <td className={`${styles.num} ${r.correct ? styles.edgePos : styles.edgeNeg}`}>{r.correct ? '✓' : '✗'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* IN-SAMPLE BACKTEST — clearly demoted */}
      <h3 className={styles.h3}>In-sample backtest <span className={styles.muted}>· calibration check only — NOT a track record</span></h3>
      <div className={styles.callout}>
        These numbers grade the model on completed games using ratings that were themselves shaped by
        those same games. That is <b>in-sample</b> — it flatters the model and is <b>not evidence of
        an edge</b>. Treat it as a sanity check on calibration, never as performance. The forward
        record above is the real test.
      </div>
      <div className={styles.clvTiles}>
        <Tile num={pct(b.acc1x2)} label="1X2 (in-sample)" />
        <Tile num={b.brier1x2.toFixed(3)} label="Brier (in-sample)" />
        <Tile num={pct(b.accOU)} label="O/U (in-sample)" />
        <Tile num={String(b.games)} label="games" />
      </div>
    </section>
  );
}

function Tile({ num, label }) {
  return (
    <div className={styles.tile}>
      <span className={styles.tileNum}>{num}</span>
      <span className={styles.tileLabel}>{label}</span>
    </div>
  );
}

/* ------------------------------------------------------------ ratings editor */
function RatingsEditor({ ratings, setRatings, resetRatings }) {
  const teams = useMemo(() => Object.keys(ratings).sort(), [ratings]);

  function edit(team, key, value) {
    const n = parseFloat(value);
    if (Number.isNaN(n)) return;
    setRatings({ ...ratings, [team]: { ...ratings[team], [key]: n } });
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(ratings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ratings.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className={styles.card}>
      <h2 className={styles.h2}>Team ratings <span className={styles.muted}>· the one input that matters</span></h2>
      <p className={styles.note}>
        These are <b>coarse seed priors</b> (tier-based, not measured). The single highest-leverage
        thing you can do is replace them with rolling xG from FBref / Understat / FotMob — recent
        xG-for and xG-against per game, normalised so 1.00 = tournament average. Edits persist in this
        browser; export to commit improved ratings back to the repo.
      </p>
      <div className={styles.editorActions}>
        <button className={styles.ghostBtn} onClick={resetRatings}>Reset to defaults</button>
        <button className={styles.ghostBtn} onClick={exportJSON}>Export JSON</button>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr><th>Team</th><th>Tier</th><th className={styles.num}>Attack (atk)</th><th className={styles.num}>Defence (dfn)</th></tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t}>
                <td>{t}</td>
                <td className={styles.muted}>{ratings[t].tier ?? '—'}</td>
                <td className={styles.num}>
                  <input className={styles.ratingInput} type="number" step="0.01" min="0.1"
                    value={ratings[t].atk} onChange={(e) => edit(t, 'atk', e.target.value)} />
                </td>
                <td className={styles.num}>
                  <input className={styles.ratingInput} type="number" step="0.01" min="0.1"
                    value={ratings[t].dfn} onChange={(e) => edit(t, 'dfn', e.target.value)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ footer */
function Footer() {
  return (
    <footer className={styles.footer}>
      <p>
        <b>Responsible gambling.</b> This is a Poisson grid with opinions — <b>not financial
        advice</b>. Stake only what you&apos;d happily lose; size with the built-in ¼-Kelly. 18+.
        GamCare: <a href="https://www.gamcare.org.uk" target="_blank" rel="noreferrer">gamcare.org.uk</a>{' '}
        · GambleAware: <a href="https://www.gambleaware.org" target="_blank" rel="noreferrer">gambleaware.org</a>.
      </p>
      <p className={styles.muted}>
        Reality check: 64 games, most still to come. Even a genuine 4% edge can&apos;t prove itself
        before the final — variance dominates a sample this small. A modelling challenge, not income.
        No LLM in the prediction path; all numbers come from the verified Dixon-Coles engine.
      </p>
    </footer>
  );
}
