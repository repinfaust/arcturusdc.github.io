/* eslint-disable require-jsdoc, indent, max-len, operator-linebreak */
/*
 * MLB Line-Movement Study — collector service (research instrument, NOT a betting model).
 * Spec: planning/MLB_LINE_STUDY_SPEC.md (D-SITE-008).
 *
 * Collects sequenced pre-game data that history cannot buy: timestamped total-line
 * snapshots (The Odds API) + game events (MLB Stats API: lineups, pitcher scratches,
 * status/time changes). No predictions, no picks, NO LLM. Functions write, clients read.
 *
 * Founding rules (inherited from WC26, DECISIONS D-SITE-007 / 2026-06-21):
 *  - No fabricated data, ever. Reject malformed rows; never write a guessed value.
 *  - Fail-closed: on API failure, log to meta and skip; single retry max, no storms.
 *  - Budget guard: never exceed the Odds API free tier; reserve credits for WC26.
 */
const admin = require('firebase-admin');

const ARCTURUSDC_TENANT_ID = 'FqhckqMaorJMAQ6B29mP';

const collections = {
  games: 'mlb_games',
  snapshots: 'mlb_line_snapshots',
  events: 'mlb_game_events',
  meta: 'mlb_meta',
};

// The Odds API — shared key with WC26 (WC26 ends at the tournament final; budget frees).
const ODDS_BASE = 'https://api.the-odds-api.com/v4';
const MLB_SPORT_KEY = 'baseball_mlb';
const MLB_STATS_BASE = 'https://statsapi.mlb.com/api/v1';

// Budget: reserve credits so a shared WC26 key is never starved by this study.
const RESERVE_CREDITS = 50; // below this remaining, skip non-close passes
const BURST_CAP_PER_DAY = 3; // max event-triggered extra odds passes per day
const LINE_MIN = 4; // reject absurd totals (suspended/garbage)
const LINE_MAX = 18;

// ─── helpers ────────────────────────────────────────────────────────────────
const ts = () => admin.firestore.FieldValue.serverTimestamp();
const nowIso = () => new Date().toISOString();
const todayNY = () => new Date().toLocaleDateString('en-CA', {timeZone: 'America/New_York'}); // YYYY-MM-DD

function slug(v) {
  return String(v || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
// Canonical doc id: MLB Stats gamePk when known, else matchup+date fallback.
function gameKey(gamePk, home, away, date) {
  return gamePk ? String(gamePk) : `${slug(away)}-at-${slug(home)}-${date}`;
}
// Pure median of finite numbers. Range validation is applied by callers where the
// meaning is known (totals lines are gated to LINE_MIN..LINE_MAX; odds are not).
function median(nums) {
  const s = nums.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!s.length) return null;
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
// Median restricted to plausible totals lines (rejects suspended/garbage points).
function medianLine(pts) {
  return median(pts.filter((n) => Number.isFinite(n) && n > LINE_MIN && n < LINE_MAX));
}
const round2 = (n) => (Number.isFinite(n) ? Math.round(n * 100) / 100 : null);

// De-vigged P(Over): normalize 1/overDec, 1/underDec to sum to 1, removing the book's margin.
function impliedOverProb(overDec, underDec) {
  if (!Number.isFinite(overDec) || !Number.isFinite(underDec) || overDec <= 0 || underDec <= 0) return null;
  const po = 1 / overDec; const pu = 1 / underDec;
  const total = po + pu;
  return total > 0 ? po / total : null;
}

// Correct-side pick (pure fn, no I/O): given any line snapshot and the real final
// total, records which side the market favored at that snapshot and whether that
// side was actually correct. Push (total === line) is recorded but excluded from
// correct/incorrect grading — neither side wins a push. Used for both the opener
// pick and the T-2h pick — same logic, different snapshot. Accuracy only — no
// value/EV claim, no recommendation.
function buildPick(snap, finalTotal) {
  if (!snap || !snap.consensus || !Number.isFinite(finalTotal)) return null;
  const {line, overDec, underDec} = snap.consensus;
  const pOver = impliedOverProb(overDec, underDec);
  if (!Number.isFinite(line) || pOver == null) return null;
  const side = pOver > 0.5 ? 'over' : pOver < 0.5 ? 'under' : null;
  if (!side) return null;
  const push = finalTotal === line;
  const correct = push ? null : (side === 'over' ? finalTotal > line : finalTotal < line);
  return {
    side, pOver: round2(pOver), line, minutesToFirstPitch: snap.minutesToFirstPitch,
    capturedAtIso: snap.capturedAtIso, push, correct,
  };
}

// Reconstructs which pitcher was probable for each side as of a given timestamp,
// by starting from the pitchers known at the opener and replaying pitcher_change
// events (payload: {side, old, new}) that occurred strictly before cutoffIso.
// Pure fn given the event list — no I/O. Returns null for a side with no known
// starter at that point (e.g. game not yet far enough along for MLB to post one).
function pitchersAsOf(openerPitchers, pitcherChangeEvents, cutoffIso) {
  const result = {
    home: (openerPitchers && openerPitchers.home) || null,
    away: (openerPitchers && openerPitchers.away) || null,
  };
  const ordered = (pitcherChangeEvents || [])
    .filter((e) => e.detectedAtIso && e.detectedAtIso <= cutoffIso)
    .sort((a, b) => String(a.detectedAtIso).localeCompare(String(b.detectedAtIso)));
  for (const e of ordered) {
    const side = e.payload && e.payload.side;
    if (side === 'home' || side === 'away') {
      result[side] = (e.payload && e.payload.new) || null;
    }
  }
  return result;
}

// Did waiting for T-2h information and re-picking actually help, vs. sticking with
// the opener pick? null when there's nothing to compare (either pick missing/push).
// 'unchanged': same side both times (revision was a no-op). 'improved': picks
// differed and T-2h was the correct one. 'worsened': picks differed and opener
// would have been correct instead.
function buildRevisionOutcome(openerPick, t2hPick) {
  if (!openerPick || !t2hPick || openerPick.push || t2hPick.push) return null;
  if (openerPick.correct == null || t2hPick.correct == null) return null;
  if (openerPick.side === t2hPick.side) return 'unchanged';
  if (t2hPick.correct && !openerPick.correct) return 'improved';
  if (!t2hPick.correct && openerPick.correct) return 'worsened';
  return 'unchanged'; // both sides graded the same way despite differing (shouldn't normally happen on a single line)
}

async function readMeta(db) {
  const snap = await db.collection(collections.meta).doc('collector').get();
  return snap.exists ? snap.data() : {};
}
// Reset per-day burst counter when the date rolls over.
function metaForToday(meta) {
  const day = todayNY();
  if (meta.day !== day) return {day, oddsCalls: 0, burstsUsed: 0, lastReset: nowIso()};
  return {day, oddsCalls: meta.oddsCalls || 0, burstsUsed: meta.burstsUsed || 0};
}

// ─── MLB Stats API (free, unlimited, no key) ─────────────────────────────────
async function fetchSchedule(date, {lineups = false} = {}) {
  const hydrate = ['probablePitcher', 'team', 'venue', 'linescore', lineups ? 'lineups' : null]
    .filter(Boolean).join(',');
  const url = `${MLB_STATS_BASE}/schedule?sportId=1&date=${date}&hydrate=${hydrate}`;
  const res = await fetch(url, {cache: 'no-store'});
  if (!res.ok) throw new Error(`MLB schedule HTTP ${res.status}`);
  const j = await res.json();
  const out = [];
  for (const d of j.dates || []) {
    for (const g of d.games || []) {
      out.push(g);
    }
  }
  return out;
}

// ─── The Odds API (metered) ──────────────────────────────────────────────────
async function fetchMlbTotals(apiKey) {
  const url = `${ODDS_BASE}/sports/${MLB_SPORT_KEY}/odds/` +
    `?apiKey=${encodeURIComponent(apiKey)}&regions=us&markets=totals&oddsFormat=decimal`;
  const res = await fetch(url, {cache: 'no-store'});
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Odds API HTTP ${res.status}: ${body.slice(0, 160)}`);
  }
  const remaining = Number(res.headers?.get?.('x-requests-remaining'));
  const events = await res.json();
  return {events, remaining: Number.isFinite(remaining) ? remaining : null};
}

/* Reduce one Odds API event to consensus + per-book totals. Rejects incomplete/absurd. */
function consensusTotals(ev) {
  if (!ev || !ev.home_team || !ev.away_team || !Array.isArray(ev.bookmakers)) return null;
  const books = {};
  const linePts = [];
  for (const bm of ev.bookmakers) {
    for (const m of bm.markets || []) {
      if (m.key !== 'totals') continue;
      const over = (m.outcomes || []).find((o) => o.name === 'Over');
      const under = (m.outcomes || []).find((o) => o.name === 'Under');
      if (over && Number.isFinite(over.point) && over.point > LINE_MIN && over.point < LINE_MAX) {
        books[bm.key] = {line: over.point, over: round2(over.price), under: round2(under && under.price)};
        linePts.push(over.point);
      }
    }
  }
  const line = medianLine(linePts);
  if (line == null) return null; // no valid book — reject, never guess
  // Consensus prices from the books nearest the consensus line. When books split
  // (e.g. 9.0 vs 9.5 -> median 9.25) no book sits exactly on the median, so take
  // the books at the modal line closest to it; fall back to all books if needed.
  const allBooks = Object.values(books);
  let priceBooks = allBooks.filter((b) => b.line === line);
  if (!priceBooks.length) {
    const nearest = allBooks.reduce((best, b) =>
      Math.abs(b.line - line) < Math.abs(best - line) ? b.line : best, allBooks[0].line);
    priceBooks = allBooks.filter((b) => b.line === nearest);
  }
  const overDec = round2(median(priceBooks.map((b) => b.over)));
  const underDec = round2(median(priceBooks.map((b) => b.under)));
  return {
    home: ev.home_team, away: ev.away_team, commenceTime: ev.commence_time,
    consensus: {line, overDec, underDec}, books,
  };
}

// ─── T-2h targeted check: free Firestore read; spends an odds credit only when ──
// at least one tracked, non-final game is currently 100-140 minutes from first
// pitch and hasn't had a T-2h snapshot yet. One odds pass (1 credit) covers every
// in-window game simultaneously — The Odds API returns the whole slate per call,
// so this is NOT a per-game cost. Designed to run every ~15 min during the slate
// window without polling-cost blowup: the check itself is free, spend is targeted.
async function t2hCheckImpl() {
  const db = admin.firestore();
  const date = todayNY();
  const gamesSnap = await db.collection(collections.games).where('date', '==', date).get();
  const now = Date.now();
  let dueCount = 0;
  for (const doc of gamesSnap.docs) {
    const g = doc.data();
    if (g.status === 'final' || g.t2hSnapshotTaken) continue;
    if (!g.scheduledFirstPitch) continue;
    const minsToFP = Math.round((new Date(g.scheduledFirstPitch) - now) / 60000);
    if (minsToFP >= 100 && minsToFP <= 140) dueCount++;
  }
  if (dueCount === 0) return {skipped: 'no-game-in-t2h-window'};
  return snapshotLinesImpl({trigger: 'cron:t2h'});
}

// ─── Snapshot pass: 1 odds call, write a snapshot per game ────────────────────
async function snapshotLinesImpl({trigger = 'cron'} = {}) {
  const db = admin.firestore();
  const apiKey = process.env.WC26_ODDS_API_KEY;
  const metaRef = db.collection(collections.meta).doc('collector');

  // Free gate: no games today AND none tomorrow -> spend nothing.
  const date = todayNY();
  let scheduled;
  try {
    scheduled = await fetchSchedule(date);
  } catch (err) {
    await metaRef.set({tenantId: ARCTURUSDC_TENANT_ID, lastError: `schedule: ${err.message}`, lastErrorAt: nowIso(), updatedAt: ts()}, {merge: true});
    return {skipped: 'schedule-fetch-failed'};
  }
  if (!scheduled.length) {
    await metaRef.set({tenantId: ARCTURUSDC_TENANT_ID, lastRun: nowIso(), lastRunNote: 'no games today — no credit spent', updatedAt: ts()}, {merge: true});
    return {skipped: 'no-games'};
  }
  if (!apiKey) {
    await metaRef.set({tenantId: ARCTURUSDC_TENANT_ID, lastError: 'WC26_ODDS_API_KEY not set', lastErrorAt: nowIso(), updatedAt: ts()}, {merge: true});
    return {skipped: 'no-api-key'};
  }

  const meta = metaForToday(await readMeta(db));

  // Burst cap enforcement
  const isBurst = trigger.startsWith('burst');
  if (isBurst && meta.burstsUsed >= BURST_CAP_PER_DAY) {
    return {skipped: 'burst-cap-reached'};
  }

  let fetched;
  try {
    fetched = await fetchMlbTotals(apiKey);
  } catch (err) {
    // single retry, then give up (no storm)
    try {
 fetched = await fetchMlbTotals(apiKey);
} catch (err2) {
      await metaRef.set({tenantId: ARCTURUSDC_TENANT_ID, lastError: `odds: ${err2.message}`, lastErrorAt: nowIso(), updatedAt: ts()}, {merge: true});
      return {skipped: 'odds-fetch-failed'};
    }
  }

  // Budget guard: if running low, only allow close-window passes.
  if (fetched.remaining != null && fetched.remaining < RESERVE_CREDITS && trigger !== 'cron:close' && !isBurst) {
    await metaRef.set({tenantId: ARCTURUSDC_TENANT_ID, lastRun: nowIso(), lastRunNote: `budget_throttle (remaining ${fetched.remaining})`, requestsRemaining: fetched.remaining, updatedAt: ts()}, {merge: true});
    return {throttled: true, remaining: fetched.remaining};
  }

  // Index scheduled games by matchup for gamePk + first-pitch reconciliation.
  const byPair = {};
  for (const g of scheduled) {
    const key = `${g.teams.away.team.name}|${g.teams.home.team.name}`;
    byPair[key] = g;
  }

  const capturedAtIso = nowIso();
  let batch = db.batch();
  let ops = 0; let written = 0; let rejected = 0;
  for (const ev of fetched.events || []) {
    const c = consensusTotals(ev);
    if (!c) {
 rejected++; continue;
}
    const sched = byPair[`${c.away}|${c.home}`];
    const gamePk = sched ? sched.gamePk : null;
    const firstPitch = sched ? sched.gameDate : c.commenceTime;
    const id = gameKey(gamePk, c.home, c.away, date);
    const minsToFP = firstPitch ? Math.round((new Date(firstPitch) - Date.now()) / 60000) : null;

    // snapshot doc (immutable, keyed by game + minute)
    const snapId = `${id}_${Math.floor(Date.now() / 60000)}`;
    batch.set(db.collection(collections.snapshots).doc(snapId), {
      tenantId: ARCTURUSDC_TENANT_ID, gamePk: gamePk || null, gameId: id,
      home: c.home, away: c.away, capturedAt: ts(), capturedAtIso,
      minutesToFirstPitch: minsToFP, trigger,
      consensus: c.consensus, books: c.books,
      requestsRemaining: fetched.remaining,
    });
    ops++;

    // game doc: set opener on first sight, always update latest/close-candidate
    const gRef = db.collection(collections.games).doc(id);
    const gSnap = await gRef.get();
    const prev = gSnap.exists ? gSnap.data() : null;
    const gamePayload = {
      tenantId: ARCTURUSDC_TENANT_ID, gamePk: gamePk || null, gameId: id,
      date, home: c.home, away: c.away,
      venue: sched ? (sched.venue && sched.venue.name) || null : (prev && prev.venue) || null,
      scheduledFirstPitch: firstPitch || null,
      probablePitchers: sched ? {
        home: sched.teams.home.probablePitcher ? {id: sched.teams.home.probablePitcher.id, name: sched.teams.home.probablePitcher.fullName} : null,
        away: sched.teams.away.probablePitcher ? {id: sched.teams.away.probablePitcher.id, name: sched.teams.away.probablePitcher.fullName} : null,
      } : (prev && prev.probablePitchers) || null,
      status: sched ? (sched.status && sched.status.abstractGameState) || null : (prev && prev.status) || null,
      latest: {line: c.consensus.line, overDec: c.consensus.overDec, underDec: c.consensus.underDec, capturedAt: capturedAtIso},
      updatedAt: ts(),
    };
    if (!prev || !prev.opener) {
      gamePayload.opener = {
        line: c.consensus.line, overDec: c.consensus.overDec, underDec: c.consensus.underDec, capturedAt: capturedAtIso,
        // Pitchers as known at the exact moment the opener was captured — the "pick as of open"
        // reference point. Frozen once; never overwritten by later passes (unlike probablePitchers above).
        pitchers: gamePayload.probablePitchers,
      };
    }
    // Mark T-2h as captured once a snapshot actually lands in the 100-140 min window,
    // so the t2hCheck pass (below) stops re-triggering an odds call for this game.
    if (!prev || !prev.t2hSnapshotTaken) {
      if (Number.isFinite(minsToFP) && minsToFP >= 100 && minsToFP <= 140) {
        gamePayload.t2hSnapshotTaken = true;
      }
    }
    batch.set(gRef, gamePayload, {merge: true});
    ops += 2; written++;
    if (ops >= 400) {
 await batch.commit(); batch = db.batch(); ops = 0;
}
  }

  meta.oddsCalls += 1;
  if (isBurst) meta.burstsUsed += 1;
  batch.set(metaRef, {
    tenantId: ARCTURUSDC_TENANT_ID, day: meta.day, oddsCalls: meta.oddsCalls, burstsUsed: meta.burstsUsed,
    lastRun: nowIso(), lastRunNote: `${trigger}: ${written} games, ${rejected} rejected`,
    requestsRemaining: fetched.remaining, updatedAt: ts(), lastError: null,
  }, {merge: true});
  await batch.commit();
  return {written, rejected, trigger, remaining: fetched.remaining};
}

// ─── Event poll: free MLB Stats API; detect lineups / scratches / status ──────
function lineupNames(sideLineup, boxLineups, side) {
  // MLB lineups hydrate: game.lineups.{homePlayers|awayPlayers} -> [{fullName}]
  const arr = boxLineups && boxLineups[side === 'home' ? 'homePlayers' : 'awayPlayers'];
  if (Array.isArray(arr) && arr.length) return arr.map((p) => p.fullName);
  return null;
}

async function pollGameDataImpl() {
  const db = admin.firestore();
  const date = todayNY();
  let games;
  try {
    games = await fetchSchedule(date, {lineups: true});
  } catch (err) {
    await db.collection(collections.meta).doc('collector').set(
      {tenantId: ARCTURUSDC_TENANT_ID, lastPollError: err.message, lastPollErrorAt: nowIso(), updatedAt: ts()}, {merge: true});
    return {skipped: 'schedule-failed'};
  }

  let events = 0;
  let material = false; // lineup posted or pitcher change -> burst candidate
  const batch = db.batch();
  for (const g of games) {
    const id = gameKey(g.gamePk, g.teams.home.team.name, g.teams.away.team.name, date);
    const gRef = db.collection(collections.games).doc(id);
    const snap = await gRef.get();
    const prev = snap.exists ? snap.data() : {};
    const track = prev.tracking || {};

    // pitcher change
    for (const side of ['home', 'away']) {
      const cur = g.teams[side].probablePitcher;
      const curId = cur ? cur.id : null;
      const prevId = prev.probablePitchers && prev.probablePitchers[side] ? prev.probablePitchers[side].id : undefined;
      if (prevId !== undefined && curId !== prevId) {
        batch.set(db.collection(collections.events).doc(), {
          tenantId: ARCTURUSDC_TENANT_ID, gameId: id, gamePk: g.gamePk, type: 'pitcher_change',
          detectedAt: ts(), detectedAtIso: nowIso(), granularityMin: 30,
          payload: {side, old: prev.probablePitchers[side], new: cur ? {id: cur.id, name: cur.fullName} : null},
        });
        events++; material = true;
      }
    }
    // lineup posted (first time we see a batting order)
    for (const side of ['home', 'away']) {
      const names = lineupNames(null, g.lineups, side);
      const already = track[`lineup_${side}`];
      if (names && !already) {
        batch.set(db.collection(collections.events).doc(), {
          tenantId: ARCTURUSDC_TENANT_ID, gameId: id, gamePk: g.gamePk, type: 'lineup_posted',
          detectedAt: ts(), detectedAtIso: nowIso(), granularityMin: 30,
          payload: {side, lineup: names},
        });
        track[`lineup_${side}`] = nowIso();
        events++; material = true;
      }
    }
    // status / first-pitch time change
    const curStatus = g.status && g.status.abstractGameState;
    if (prev.status && curStatus && curStatus !== prev.status) {
      batch.set(db.collection(collections.events).doc(), {
        tenantId: ARCTURUSDC_TENANT_ID, gameId: id, gamePk: g.gamePk, type: 'status_change',
        detectedAt: ts(), detectedAtIso: nowIso(), granularityMin: 30,
        payload: {old: prev.status, new: curStatus},
      });
      events++;
    }
    const statusPayload = {tracking: track, updatedAt: ts()};
    if (curStatus) statusPayload.status = curStatus;
    batch.set(gRef, statusPayload, {merge: true});
  }
  await batch.commit();

  // Trigger one burst snapshot if material news landed and cap allows.
  let burst = null;
  if (material) {
    const meta = metaForToday(await readMeta(db));
    if (meta.burstsUsed < BURST_CAP_PER_DAY) {
      burst = await snapshotLinesImpl({trigger: 'burst:material_event'});
    }
  }
  await db.collection(collections.meta).doc('collector').set(
    {tenantId: ARCTURUSDC_TENANT_ID, lastPoll: nowIso(), lastPollEvents: events, updatedAt: ts()}, {merge: true});
  return {events, burst};
}

// ─── Finalizer: yesterday's finals + close + move summary ─────────────────────
async function finalizeDayImpl() {
  const db = admin.firestore();
  // yesterday NY
  const y = new Date(Date.now() - 24 * 3600 * 1000).toLocaleDateString('en-CA', {timeZone: 'America/New_York'});
  let games;
  try {
 games = await fetchSchedule(y);
} catch (err) {
 return {skipped: `schedule ${err.message}`};
}

  let finalized = 0;
  for (const g of games) {
    if (!g.status || g.status.abstractGameState !== 'Final') continue;
    const ar = g.teams.away.score; const hr = g.teams.home.score;
    if (typeof ar !== 'number' || typeof hr !== 'number') continue;
    const id = gameKey(g.gamePk, g.teams.home.team.name, g.teams.away.team.name, y);
    const gRef = db.collection(collections.games).doc(id);
    const snap = await gRef.get();
    const prev = snap.exists ? snap.data() : null;

    // close = last snapshot before first pitch
    const allSnaps = await db.collection(collections.snapshots).where('gameId', '==', id).get();
    const snapDocs = allSnaps.docs.map((d) => d.data()).sort((a, b) => String(a.capturedAtIso).localeCompare(String(b.capturedAtIso)));
    const closeSnap = snapDocs.length ? snapDocs[snapDocs.length - 1] : null;
    const nSnaps = snapDocs.length;
    const eventsSnap = await db.collection(collections.events).where('gameId', '==', id).get();
    const gameEvents = eventsSnap.docs.map((d) => d.data());
    const nEvents = gameEvents.length;
    const pitcherChangeEvents = gameEvents.filter((e) => e.type === 'pitcher_change');

    // T-2h pick: snapshot closest to (but not after) 120 minutes-to-first-pitch,
    // graded on whether its de-vigged P(Over) side matches the real final total.
    // Opener pick: same grading, applied to the very first snapshot instead.
    // Correct-side accuracy only — not a value/EV claim, never a recommendation to bet.
    const openerSnap = snapDocs[0] || null;
    const t2hSnap = snapDocs
      .filter((s) => Number.isFinite(s.minutesToFirstPitch) && s.minutesToFirstPitch >= 100 && s.minutesToFirstPitch <= 140)
      .sort((a, b) => Math.abs(a.minutesToFirstPitch - 120) - Math.abs(b.minutesToFirstPitch - 120))[0] || null;
    const openerPick = buildPick(openerSnap, ar + hr);
    const t2hPick = buildPick(t2hSnap, ar + hr);
    const revisionOutcome = buildRevisionOutcome(openerPick, t2hPick);

    // Starting pitchers as known at each pick point — reconstructed by replaying
    // pitcher_change events up to each snapshot's timestamp, starting from the
    // pitchers frozen at opener capture (see snapshotLinesImpl).
    const openerPitchers = (prev && prev.opener && prev.opener.pitchers) || null;
    const pitchersAtOpener = openerSnap ? pitchersAsOf(openerPitchers, pitcherChangeEvents, openerSnap.capturedAtIso) : openerPitchers;
    const pitchersAtT2h = t2hSnap ? pitchersAsOf(openerPitchers, pitcherChangeEvents, t2hSnap.capturedAtIso) : null;
    const pitcherChangedBeforeT2h = !!(pitchersAtT2h && pitchersAtOpener && (
      (pitchersAtT2h.home && pitchersAtOpener.home && pitchersAtT2h.home.id !== pitchersAtOpener.home.id) ||
      (pitchersAtT2h.away && pitchersAtOpener.away && pitchersAtT2h.away.id !== pitchersAtOpener.away.id)
    ));

    const opener = prev && prev.opener ? prev.opener.line : null;
    const close = closeSnap ? closeSnap.consensus.line : (prev && prev.latest ? prev.latest.line : null);
    await gRef.set({
      tenantId: ARCTURUSDC_TENANT_ID, status: 'final',
      finalTotal: ar + hr, awayRuns: ar, homeRuns: hr,
      close: close != null ? {line: close, capturedAt: closeSnap ? closeSnap.capturedAtIso : null} : (prev && prev.close) || null,
      moveSummary: (opener != null && close != null) ? {
        delta: round2(close - opener), nSnapshots: nSnaps, nEvents,
        openerToActual: round2((prev.finalTotal != null ? prev.finalTotal : ar + hr) - opener),
      } : null,
      openerPick,
      t2hPick,
      revisionOutcome,
      pitchersAtOpener,
      pitchersAtT2h,
      pitcherChangedBeforeT2h,
      finalizedAt: ts(), updatedAt: ts(),
    }, {merge: true});
    finalized++;
  }
  // reset the per-day burst/odds counter for the new day
  await db.collection(collections.meta).doc('collector').set(
    {tenantId: ARCTURUSDC_TENANT_ID, day: todayNY(), oddsCalls: 0, burstsUsed: 0, lastFinalize: nowIso(), lastFinalized: finalized, updatedAt: ts()}, {merge: true});
  return {finalized};
}

// ─── scheduled wrappers (v1 firebase-functions, wired in index.js) ────────────
async function snapshotLinesScheduled() {
 return snapshotLinesImpl({trigger: 'cron'});
}
async function snapshotLinesCloseScheduled() {
 return snapshotLinesImpl({trigger: 'cron:close'});
}
async function pollGameDataScheduled() {
 return pollGameDataImpl();
}
async function finalizeDayScheduled() {
 return finalizeDayImpl();
}
async function t2hCheckScheduled() {
 return t2hCheckImpl();
}

module.exports = {
  ARCTURUSDC_TENANT_ID,
  collections,
  medianLine,
  median,
  gameKey,
  impliedOverProb,
  buildPick,
  pitchersAsOf,
  buildRevisionOutcome,
  snapshotLinesImpl,
  pollGameDataImpl,
  finalizeDayImpl,
  t2hCheckImpl,
  snapshotLinesScheduled,
  snapshotLinesCloseScheduled,
  pollGameDataScheduled,
  finalizeDayScheduled,
  t2hCheckScheduled,
};
