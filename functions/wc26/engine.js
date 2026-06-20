/* eslint-disable */
/*
 * WC2026 xG Value Engine — JavaScript port (ES module).
 * Direct line-for-line port of the Python engine, verified against the same
 * 19 correctness checks. DO NOT reimplement the maths — import and use it.
 *
 * Dixon-Coles bivariate-Poisson, calibrated to expected goals.
 * Reference: Dixon & Coles (1997), Applied Statistics 46(2).
 */

const DEFAULTS = { baseGoals: 1.25, rho: -0.08, maxGoals: 12 };
// baseGoals 1.25 ≈ 2.50 goals/game = historical WC GROUP-STAGE rate.
// Nudge to 1.30–1.35 for open knockout games. This is the one calibration knob.

function factorial(k) { let f = 1; for (let i = 2; i <= k; i++) f *= i; return f; }

function poissonPmf(k, lam) {
  return Math.exp(-lam) * Math.pow(lam, k) / factorial(k);
}

// Dixon-Coles low-score correction. rho<0 inflates 0-0 & 1-1; rho=0 => independent Poisson.
function dcTau(x, y, lam, mu, rho) {
  if (x === 0 && y === 0) return 1 - lam * mu * rho;
  if (x === 0 && y === 1) return 1 + lam * rho;
  if (x === 1 && y === 0) return 1 + mu * rho;
  if (x === 1 && y === 1) return 1 - rho;
  return 1;
}

function buildMatrix(lamHome, lamAway, rho = DEFAULTS.rho, maxGoals = DEFAULTS.maxGoals) {
  const n = maxGoals + 1;
  const M = Array.from({ length: n }, () => new Array(n).fill(0));
  let s = 0;
  for (let x = 0; x < n; x++) {
    const px = poissonPmf(x, lamHome);
    for (let y = 0; y < n; y++) {
      const v = px * poissonPmf(y, lamAway) * dcTau(x, y, lamHome, lamAway, rho);
      M[x][y] = v; s += v;
    }
  }
  for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) M[x][y] /= s; // renormalise
  return M;
}

/**
 * Build a priced match from two team ratings {atk, dfn}.
 * lamHome = base * atkHome * dfnAway * (homeAdv if !neutral)
 * lamAway = base * atkAway * dfnHome
 */
function buildMatch(home, away, opts = {}) {
  const base = opts.baseGoals ?? DEFAULTS.baseGoals;
  const rho = opts.rho ?? DEFAULTS.rho;
  const neutral = opts.neutral ?? true;
  const homeAdv = opts.homeAdv ?? 1.0; // apply ~1.25 for genuine host-venue games
  const ha = neutral ? 1.0 : homeAdv;
  const lamHome = base * home.atk * away.dfn * ha;
  const lamAway = base * away.atk * home.dfn;
  return { lamHome, lamAway, expTotal: lamHome + lamAway, matrix: buildMatrix(lamHome, lamAway, rho) };
}

function prob(M, pred) {
  let t = 0;
  for (let x = 0; x < M.length; x++) for (let y = 0; y < M.length; y++) if (pred(x, y)) t += M[x][y];
  return t;
}
const fair = (p) => (p <= 0 ? Infinity : 1 / p);

// ---- markets (all derived from the single matrix) -------------------------
function market1x2(m) {
  const home = prob(m.matrix, (x, y) => x > y);
  const draw = prob(m.matrix, (x, y) => x === y);
  const away = prob(m.matrix, (x, y) => x < y);
  return { Home: [home, fair(home)], Draw: [draw, fair(draw)], Away: [away, fair(away)] };
}
function marketDoubleChance(m) {
  const x = market1x2(m); const [h] = x.Home, [d] = x.Draw, [a] = x.Away;
  return { "1X": [h + d, fair(h + d)], "12": [h + a, fair(h + a)], "X2": [d + a, fair(d + a)] };
}
function marketBTTS(m) {
  const yes = prob(m.matrix, (x, y) => x >= 1 && y >= 1);
  return { "BTTS Yes": [yes, fair(yes)], "BTTS No": [1 - yes, fair(1 - yes)] };
}
function marketTotals(m, lines = [1.5, 2.5, 3.5]) {
  const out = {};
  for (const ln of lines) {
    const over = prob(m.matrix, (x, y) => x + y > ln);
    out[`Over ${ln}`] = [over, fair(over)];
    out[`Under ${ln}`] = [1 - over, fair(1 - over)];
  }
  return out;
}
function marketTeamTotals(m, lines = [0.5, 1.5, 2.5]) {
  const out = {};
  for (const ln of lines) {
    const ho = prob(m.matrix, (x) => x > ln);
    const ao = prob(m.matrix, (_x, y) => y > ln);
    out[`Home Over ${ln}`] = [ho, fair(ho)]; out[`Home Under ${ln}`] = [1 - ho, fair(1 - ho)];
    out[`Away Over ${ln}`] = [ao, fair(ao)]; out[`Away Under ${ln}`] = [1 - ao, fair(1 - ao)];
  }
  return out;
}
function marketAsianHandicap(m, lines = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2]) {
  const out = {};
  for (const h of lines) {
    let win = 0, push = 0;
    for (let x = 0; x < m.matrix.length; x++) for (let y = 0; y < m.matrix.length; y++) {
      const p = m.matrix[x][y]; const margin = (x - y) + h;
      if (Math.abs(margin) < 1e-9) push += p; else if (margin > 0) win += p;
    }
    const dec = 1 - push; const adj = dec > 0 ? win / dec : 0;
    out[`Home ${h >= 0 ? "+" : ""}${h.toFixed(2)}`] = [adj, fair(adj)];
  }
  return out;
}
function marketCorrectScore(m, top = 8) {
  const s = [];
  for (let x = 0; x < m.matrix.length; x++) for (let y = 0; y < m.matrix.length; y++) s.push([`${x}-${y}`, m.matrix[x][y]]);
  s.sort((a, b) => b[1] - a[1]);
  return Object.fromEntries(s.slice(0, top).map(([k, p]) => [k, [p, fair(p)]]));
}
function priceAll(m) {
  return {
    "1X2": market1x2(m), "Double Chance": marketDoubleChance(m), "BTTS": marketBTTS(m),
    "Totals": marketTotals(m), "Team Totals": marketTeamTotals(m),
    "Asian Handicap": marketAsianHandicap(m), "Correct Score": marketCorrectScore(m),
  };
}

// ---- devig / EV / staking -------------------------------------------------
function devigMultiplicative(odds) {
  const raw = odds.map((o) => 1 / o); const s = raw.reduce((a, b) => a + b, 0);
  return raw.map((r) => r / s);
}
function ev(modelP, offered) { return modelP * (offered - 1) - (1 - modelP); }
function kelly(modelP, offered, fraction = 0.25) {
  const b = offered - 1; const edge = modelP * b - (1 - modelP);
  if (edge <= 0 || b <= 0) return 0;
  return Math.max(0, (edge / b) * fraction);
}

// ---- recommendation engine ------------------------------------------------
const SMALL_MARKETS = new Set(["Team Totals", "BTTS", "Totals", "Correct Score"]);
const dangerZone = (o) => o >= 1.34 && o <= 1.50;

/**
 * Scan fixtures and return ranked value bets. Each fixture:
 *   { home, away, neutral, odds: { "Over 2.5": 1.9, "BTTS Yes": 2.1, ... } }
 * ratings: { TeamName: {atk, dfn}, ... }
 * Returns array sorted best-first, longshots/low-confidence sunk to the bottom.
 */
function recommend(fixtures, ratings, opts = {}) {
  const edgeMain = opts.edgeMain ?? 0.03;
  const edgeSmall = opts.edgeSmall ?? 0.015;
  const bankroll = opts.bankroll ?? 100;
  const out = [];
  for (const f of fixtures) {
    const h = ratings[f.home], a = ratings[f.away];
    if (!h || !a) continue;
    const m = buildMatch(h, a, { neutral: f.neutral ?? true });
    const priced = priceAll(m);
    for (const [sel, offered] of Object.entries(f.odds || {})) {
      if (!offered || offered <= 1) continue;
      let modelP = null, group = null;
      for (const [g, mkt] of Object.entries(priced)) if (mkt[sel]) { modelP = mkt[sel][0]; group = g; break; }
      if (modelP == null) continue;
      const e = ev(modelP, offered);
      let thresh, flag = "";
      if (SMALL_MARKETS.has(group)) thresh = edgeSmall;
      else if (offered >= 6.0) { thresh = 0.10; flag = "LONGSHOT — low confidence"; }
      else thresh = edgeMain;
      if (dangerZone(offered) && (group === "1X2" || group === "Asian Handicap")) flag = "DANGER-ZONE FAV (fade)";
      if (e >= thresh) {
        out.push({
          match: `${f.home} v ${f.away}`, group, selection: sel,
          modelProb: modelP, fairOdds: fair(modelP), offered,
          edge: e, stakeUnits: +(kelly(modelP, offered) * bankroll).toFixed(2),
          smallMarket: SMALL_MARKETS.has(group), flag,
        });
      }
    }
  }
  const isLongshot = (r) => r.flag.startsWith("LONGSHOT");
  out.sort((p, q) => (isLongshot(p) - isLongshot(q)) || (q.edge - p.edge));
  return out;
}

/** Single headline pick: best non-longshot value bet, small markets preferred. */
function topRecommendation(fixtures, ratings, opts = {}) {
  const all = recommend(fixtures, ratings, opts).filter((r) => !r.flag.startsWith("LONGSHOT"));
  if (!all.length) return null;
  const small = all.filter((r) => r.smallMarket);
  return (small[0] || all[0]);
}

// ---- model track-record grading (strike rate) -----------------------------
/**
 * results: [{ home, away, g1, g2 }]  (completed games)
 * Grades the BLIND model prediction vs actual. Returns per-game + summary.
 */
function gradeHistory(results, ratings, opts = {}) {
  const rows = []; let hit1x2 = 0, hitOU = 0, brier = 0, n = 0;
  for (const r of results) {
    const h = ratings[r.home], a = ratings[r.away];
    if (!h || !a) continue;
    const m = buildMatch(h, a, { neutral: r.neutral ?? true });
    const x = market1x2(m); const probs = [x.Home[0], x.Draw[0], x.Away[0]];
    const idx = r.g1 > r.g2 ? 0 : (r.g1 === r.g2 ? 1 : 2);
    const pickIdx = probs.indexOf(Math.max(...probs));
    const labels = ["Home", "Draw", "Away"];
    const ok = pickIdx === idx; hit1x2 += ok ? 1 : 0;
    brier += probs.reduce((s, p, i) => s + (p - (i === idx ? 1 : 0)) ** 2, 0);
    const pOver = marketTotals(m, [2.5])["Over 2.5"][0];
    const overOk = (pOver > 0.5) === (r.g1 + r.g2 > 2.5); hitOU += overOk ? 1 : 0;
    n++;
    rows.push({
      match: `${r.home} ${r.g1}-${r.g2} ${r.away}`, pick: labels[pickIdx],
      pickProb: Math.max(...probs), actual: labels[idx], correct: ok,
      modelXg: [m.lamHome, m.lamAway], ouCorrect: overOk,
    });
  }
  return {
    rows,
    summary: {
      games: n,
      acc1x2: n ? hit1x2 / n : 0,
      brier1x2: n ? brier / n : 0,   // uniform baseline 0.667
      accOU: n ? hitOU / n : 0,
    },
  };
}

module.exports = {
  DEFAULTS,
  buildMatch,
  priceAll,
  market1x2,
  marketTotals,
  marketTeamTotals,
  marketBTTS,
  marketAsianHandicap,
  marketCorrectScore,
  devigMultiplicative,
  ev,
  kelly,
  recommend,
  topRecommendation,
  gradeHistory,
};
