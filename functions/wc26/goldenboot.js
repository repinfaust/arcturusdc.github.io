/* eslint-disable require-jsdoc, indent, max-len, operator-linebreak */
/*
 * WC26 Golden Boot — deterministic scorer standings + seeded Monte Carlo
 * forecast of the top-scorer race. NO LLM anywhere.
 *
 * Inputs (all real, stored data):
 *  - Scorers: openfootball/worldcup.json `goals1`/`goals2` per match (player
 *    name, minute, penalty/owngoal flags). Own goals are excluded from player
 *    tallies; extra-time goals count (FIFA Golden Boot rule); shootout
 *    penalties do not (they are not in the goals arrays).
 *  - Bracket: knockout matches carry `num` (73–104); `W{num}`/`L{num}`
 *    placeholders give the full dependency graph. Advancement is resolved from
 *    ft → et → pen scores; a played draw whose shootout winner is not yet in
 *    the source is sampled 50/50 per sim (disclosed modelling assumption —
 *    never invented as fact).
 *  - Match model: per pairing, sharp-market lambdas (when the fixture has
 *    them) blended 90/10 with the Elo-model lambdas — the goals-accurate
 *    anchor per the 2026-07-03 accuracy work; pure Elo lambdas otherwise.
 *
 * Modelling assumptions (documented on the page):
 *  - Knockout 90-min draws: extra time sampled as Poisson at 1/3 of each
 *    side's match lambda (ET goals count for the Boot); still level → pens
 *    resolved 50/50. Pens never add goals.
 *  - Team goals are allocated to players by their observed share of the
 *    team's player-attributed goals, shrunk toward an "other players" bucket
 *    with prior weight K=3 (a team's future scorers are not only its past
 *    ones).
 *  - Ties for most goals count every tied player as "top scorer" — FIFA's
 *    assists/minutes tiebreak is not modelled.
 */

const admin = require('firebase-admin');
const functions = require('firebase-functions');
const engine = require('./engine');

const ARCTURUSDC_TENANT_ID = 'FqhckqMaorJMAQ6B29mP';
const SUPER_ADMINS = ['repinfaust@gmail.com', 'daryn.shaxted@gmail.com'];
const SOURCE_URL = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';

const TEAM_ALIASES = {
  'Czech Republic': 'Czechia',
  'South Korea': 'Korea Republic',
  'USA': 'United States',
  'Bosnia & Herzegovina': 'Bosnia and Herzegovina',
  'Cape Verde': 'Cabo Verde',
  'Curaçao': 'Curacao',
};
const canon = (n) => TEAM_ALIASES[n] || n;
const slug = (v) => String(v || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const matchId = (h, a) => `${slug(h)}-v-${slug(a)}`;
const round4 = (v) => Math.round(v * 10000) / 10000;

const W_MARKET_GOALS = 0.9; // sharp-lambda share for goal simulation (see service.js W_MARKET_TOTALS)
const OTHER_PRIOR_K = 3;    // shrinkage weight of the "other players" bucket
const ET_LAMBDA_SCALE = 30 / 90;

/* Deterministic RNG (mulberry32) so a rerun with the same inputs + seed is identical. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── Scorers ──────────────────────────────────────────────────────────────── */

function parseScorers(payload) {
  const players = new Map(); // `${name}|${team}` -> {name, team, goals, pens}
  const teamPlayerGoals = new Map(); // team -> player-attributed goals
  for (const m of payload.matches || []) {
    for (const [side, rawTeam] of [['goals1', m.team1], ['goals2', m.team2]]) {
      const team = canon((rawTeam || '').trim());
      for (const g of m[side] || []) {
        if (!g || !g.name || g.owngoal) continue;
        const key = `${g.name}|${team}`;
        const p = players.get(key) || {name: g.name, team, goals: 0, pens: 0};
        p.goals += 1;
        if (g.penalty) p.pens += 1;
        players.set(key, p);
        teamPlayerGoals.set(team, (teamPlayerGoals.get(team) || 0) + 1);
      }
    }
  }
  return {players, teamPlayerGoals};
}

/* ── Bracket ──────────────────────────────────────────────────────────────── */

function hasFt(m) {
  return m && m.score && Array.isArray(m.score.ft) && m.score.ft.length === 2;
}

/* Winner of a completed knockout match: ft → et → pen; null = unknown (pens
 * played but shootout score not yet in the source). */
function koWinnerIndex(m) {
  const tiers = [m.score.ft, m.score.et, m.score.pen];
  for (const s of tiers) {
    if (Array.isArray(s) && s.length === 2 && s[0] !== s[1]) return s[0] > s[1] ? 0 : 1;
  }
  return null;
}

const PLACEHOLDER_RE = /^([WL])(\d+)$/;

/*
 * Bracket state from the source. Returns:
 *  - byNum: completed knockout matches (num -> {teams:[a,b], winnerIdx|null})
 *  - pending: unplayed matches in num order, slots either {team} or
 *    {ref, want:'W'|'L'} (candidates resolved at sim time)
 *  - aliveTeams: every team that can still play another game
 */
function parseBracket(payload) {
  const ko = (payload.matches || []).filter((m) => m.num != null);
  const byNum = new Map();
  const pending = [];
  for (const m of ko) {
    if (hasFt(m)) {
      byNum.set(m.num, {
        num: m.num,
        teams: [canon(m.team1.trim()), canon(m.team2.trim())],
        winnerIdx: koWinnerIndex(m),
      });
    } else {
      const slot = (raw) => {
        const t = (raw || '').trim();
        const ph = PLACEHOLDER_RE.exec(t);
        return ph ? {ref: Number(ph[2]), want: ph[1]} : {team: canon(t)};
      };
      pending.push({num: m.num, round: m.round || null, slots: [slot(m.team1), slot(m.team2)]});
    }
  }
  pending.sort((a, b) => a.num - b.num);

  // Teams that can still appear: named in a pending slot, or a candidate of an
  // unresolved reference chain rooted in a pending slot.
  const alive = new Set();
  const candidatesOf = (s) => {
    if (s.team) return [s.team];
    const done = byNum.get(s.ref);
    if (done) {
      if (done.winnerIdx == null) return done.teams; // unknown shootout winner
      return [s.want === 'W' ? done.teams[done.winnerIdx] : done.teams[1 - done.winnerIdx]];
    }
    const dep = pending.find((p) => p.num === s.ref);
    if (!dep) return [];
    // Winner OR loser of a future match: every participant is a candidate.
    return dep.slots.flatMap(candidatesOf);
  };
  for (const p of pending) for (const s of p.slots) for (const t of candidatesOf(s)) alive.add(t);

  return {byNum, pending, aliveTeams: alive};
}

/* ── Simulation ───────────────────────────────────────────────────────────── */

function sampleFromMatrix(matrix, rng) {
  const u = rng();
  let acc = 0;
  for (let x = 0; x < matrix.length; x++) {
    for (let y = 0; y < matrix[x].length; y++) {
      acc += matrix[x][y];
      if (u <= acc) return [x, y];
    }
  }
  return [0, 0];
}

function samplePoisson(lam, rng) {
  const L = Math.exp(-lam);
  let k = 0; let p = 1;
  do { k += 1; p *= rng(); } while (p > L && k < 20);
  return k - 1;
}

/*
 * Monte Carlo the remaining bracket. Pure function — everything it needs is
 * passed in. Returns per-player forecast + diagnostics.
 */
function simulateGoldenBoot({payload, ratings, lambdasByMatchId, sims = 20000, seed = 20260704}) {
  const {players, teamPlayerGoals} = parseScorers(payload);
  const {byNum, pending, aliveTeams} = parseBracket(payload);
  const rng = mulberry32(seed);

  // Per-team allocation shares: players' shrunk shares + an "other" bucket.
  const teamShares = new Map(); // team -> [{key|null(other), share}]
  const teamsInPlay = new Set([...aliveTeams]);
  for (const team of teamsInPlay) {
    const tg = teamPlayerGoals.get(team) || 0;
    const denom = tg + OTHER_PRIOR_K;
    const rows = [];
    for (const [key, p] of players) {
      if (p.team !== team) continue;
      rows.push({key, share: p.goals / denom});
    }
    rows.push({key: null, share: OTHER_PRIOR_K / denom});
    teamShares.set(team, rows);
  }

  // Score-matrix cache per ordered pairing.
  const matrixCache = new Map();
  const matchModel = (home, away) => {
    const ck = `${home}|${away}`;
    if (matrixCache.has(ck)) return matrixCache.get(ck);
    const h = ratings[home]; const a = ratings[away];
    if (!h || !a) throw new Error(`No rating for pairing ${home} v ${away}`);
    const elo = engine.buildMatch(h, a, {neutral: true});
    const sharp = lambdasByMatchId[matchId(home, away)] || null;
    let lamHome = elo.lamHome; let lamAway = elo.lamAway;
    let source = 'elo';
    if (sharp && Number.isFinite(Number(sharp.lamHome)) && Number.isFinite(Number(sharp.lamAway))) {
      lamHome = W_MARKET_GOALS * Number(sharp.lamHome) + (1 - W_MARKET_GOALS) * elo.lamHome;
      lamAway = W_MARKET_GOALS * Number(sharp.lamAway) + (1 - W_MARKET_GOALS) * elo.lamAway;
      source = 'sharp-blend';
    }
    const m = engine.buildMatchFromLambdas(lamHome, lamAway);
    const model = {matrix: m.matrix, lamHome, lamAway, source};
    matrixCache.set(ck, model);
    return model;
  };

  // Aggregates.
  const agg = new Map(); // player key -> {sumFinal, top, outright}
  for (const [key, p] of players) agg.set(key, {sumFinal: 0, top: 0, outright: 0, current: p.goals});
  const teamGamesSum = new Map();
  let sharpPairings = 0; let eloPairings = 0;

  for (let s = 0; s < sims; s++) {
    const winnerOf = new Map(); // num -> team, loserOf num -> team
    const loserOf = new Map();
    for (const [num, done] of byNum) {
      if (done.winnerIdx != null) {
        winnerOf.set(num, done.teams[done.winnerIdx]);
        loserOf.set(num, done.teams[1 - done.winnerIdx]);
      } else {
        // Shootout winner not yet in the source: 50/50 this sim.
        const w = rng() < 0.5 ? 0 : 1;
        winnerOf.set(num, done.teams[w]);
        loserOf.set(num, done.teams[1 - w]);
      }
    }
    const resolveSlot = (slot) =>
      slot.team || (slot.want === 'W' ? winnerOf.get(slot.ref) : loserOf.get(slot.ref));

    const simGoals = new Map(); // team -> goals this sim

    for (const p of pending) {
      const home = resolveSlot(p.slots[0]);
      const away = resolveSlot(p.slots[1]);
      const model = matchModel(home, away);
      if (s === 0) (model.source === 'sharp-blend' ? sharpPairings++ : eloPairings++);
      let [g1, g2] = sampleFromMatrix(model.matrix, rng);
      if (g1 === g2) {
        // Extra time (goals count), then pens (they don't).
        const e1 = samplePoisson(model.lamHome * ET_LAMBDA_SCALE, rng);
        const e2 = samplePoisson(model.lamAway * ET_LAMBDA_SCALE, rng);
        g1 += e1; g2 += e2;
        const homeWins = g1 === g2 ? rng() < 0.5 : g1 > g2;
        winnerOf.set(p.num, homeWins ? home : away);
        loserOf.set(p.num, homeWins ? away : home);
      } else {
        winnerOf.set(p.num, g1 > g2 ? home : away);
        loserOf.set(p.num, g1 > g2 ? away : home);
      }
      simGoals.set(home, (simGoals.get(home) || 0) + g1);
      simGoals.set(away, (simGoals.get(away) || 0) + g2);
      teamGamesSum.set(home, (teamGamesSum.get(home) || 0) + 1);
      teamGamesSum.set(away, (teamGamesSum.get(away) || 0) + 1);
    }

    // Allocate this sim's team goals to players by share.
    const simPlayerGoals = new Map();
    for (const [team, n] of simGoals) {
      const shares = teamShares.get(team);
      if (!shares) continue;
      for (let g = 0; g < n; g++) {
        let u = rng(); let picked = null;
        for (const row of shares) {
          u -= row.share;
          if (u <= 0) { picked = row.key; break; }
        }
        if (picked) simPlayerGoals.set(picked, (simPlayerGoals.get(picked) || 0) + 1);
        // picked === null → "other players" bucket: a goal by someone not yet
        // on the scoresheet; it cannot win the Boot for a tracked player.
      }
    }

    // Final tallies + top-scorer bookkeeping.
    let best = 0;
    const finals = new Map();
    for (const [key, a] of agg) {
      const f = a.current + (simPlayerGoals.get(key) || 0);
      finals.set(key, f);
      a.sumFinal += f;
      if (f > best) best = f;
    }
    let atBest = 0;
    for (const f of finals.values()) if (f === best) atBest++;
    for (const [key, a] of agg) {
      if (finals.get(key) === best) {
        a.top += 1;
        if (atBest === 1) a.outright += 1;
      }
    }
  }

  const forecast = [...agg.entries()].map(([key, a]) => {
    const p = players.get(key);
    return {
      name: p.name,
      team: p.team,
      goals: p.goals,
      pens: p.pens,
      alive: aliveTeams.has(p.team),
      expFinal: round4(a.sumFinal / sims),
      pTop: round4(a.top / sims),
      pOutright: round4(a.outright / sims),
    };
  }).sort((x, y) => (y.pTop - x.pTop) || (y.goals - x.goals));

  const standings = [...players.values()]
    .map((p) => ({...p, alive: aliveTeams.has(p.team)}))
    .sort((x, y) => (y.goals - x.goals) || ((y.alive ? 1 : 0) - (x.alive ? 1 : 0)));

  return {
    forecast,
    standings,
    diagnostics: {
      sims, seed,
      pendingMatches: pending.length,
      aliveTeams: aliveTeams.size,
      // Only shootouts whose winner an upcoming match actually depends on —
      // others were revealed by the source naming the team downstream.
      unknownShootouts: [...byNum.values()]
        .filter((d) => d.winnerIdx == null &&
          pending.some((p) => p.slots.some((sl) => sl.ref === d.num)))
        .map((d) => `${d.teams[0]} v ${d.teams[1]}`),
      sharpPairings, eloPairings,
      expGamesByTeam: Object.fromEntries([...teamGamesSum.entries()].map(([t, n]) => [t, round4(n / sims)])),
    },
  };
}

/* ── Firestore wrapper ────────────────────────────────────────────────────── */

async function refreshWc26GoldenBootImpl({sims = 20000, seed = 20260704} = {}) {
  const db = admin.firestore();

  const res = await fetch(SOURCE_URL, {headers: {Accept: 'application/json'}});
  if (!res.ok) throw new Error(`source HTTP ${res.status}`);
  const payload = await res.json();

  const [teamsSnap, fixturesSnap] = await Promise.all([
    db.collection('wc26_teams').where('tenantId', '==', ARCTURUSDC_TENANT_ID).get(),
    db.collection('wc26_fixtures').where('tenantId', '==', ARCTURUSDC_TENANT_ID).get(),
  ]);
  const ratings = {};
  teamsSnap.forEach((d) => {
    const x = d.data();
    if (x.name && Number.isFinite(Number(x.atk))) ratings[x.name] = {atk: Number(x.atk), dfn: Number(x.dfn)};
  });
  const lambdasByMatchId = {};
  fixturesSnap.forEach((d) => {
    const x = d.data();
    if (x.marketLambdas) lambdasByMatchId[d.id] = x.marketLambdas;
  });

  const out = simulateGoldenBoot({payload, ratings, lambdasByMatchId, sims, seed});
  const now = admin.firestore.FieldValue.serverTimestamp();

  await db.collection('wc26_meta').doc('goldenboot').set({
    tenantId: ARCTURUSDC_TENANT_ID,
    source: 'openfootball/worldcup.json + seeded Monte Carlo',
    method: 'bracket MC: sharp-blend/Elo lambdas, DC matrix sampling, ET 1/3-lambda (goals count), pens 50/50 (no goals); player shares shrunk with other-bucket K=' + OTHER_PRIOR_K,
    forecast: out.forecast.slice(0, 30),
    diagnostics: out.diagnostics,
    updatedAt: now,
  });
  await db.collection('wc26_meta').doc('scorers').set({
    tenantId: ARCTURUSDC_TENANT_ID,
    source: 'openfootball/worldcup.json',
    rows: out.standings.slice(0, 50),
    totalGoalRecords: out.standings.reduce((s, p) => s + p.goals, 0),
    updatedAt: now,
  });

  return {
    tenantId: ARCTURUSDC_TENANT_ID,
    players: out.standings.length,
    top: out.forecast.slice(0, 5).map((f) => `${f.name} ${f.goals}g pTop=${f.pTop}`),
    diagnostics: out.diagnostics,
  };
}

function requireSuperAdmin(context) {
  const email = String((context && context.auth && context.auth.token.email) || '').toLowerCase();
  if (!email || !SUPER_ADMINS.includes(email)) {
    throw new functions.https.HttpsError('permission-denied', 'Only STEa super admins can run WC26 admin sync jobs.');
  }
}

async function refreshWc26GoldenBootNow(data, context) {
  requireSuperAdmin(context);
  return refreshWc26GoldenBootImpl(data || {});
}

async function refreshWc26GoldenBootScheduled() {
  return refreshWc26GoldenBootImpl();
}

module.exports = {
  parseScorers,
  parseBracket,
  simulateGoldenBoot,
  refreshWc26GoldenBootImpl,
  refreshWc26GoldenBootNow,
  refreshWc26GoldenBootScheduled,
};
