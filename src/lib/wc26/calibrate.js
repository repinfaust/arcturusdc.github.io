/*
 * WC26 sharp-market calibration blend.
 *
 * Pulls SHARP books only (Pinnacle + exchanges, via The Odds API `eu` region),
 * devigs the 1X2 AND Over/Under 2.5 lines TOGETHER for each fixture, and solves
 * for the (lamHome, lamAway) Poisson means the sharp market implies. A 1X2 alone
 * does not pin the goal level (that would leave it on our base_goals guess), so
 * anchoring result + total together is what makes this coherent.
 *
 * The implied lambdas are converted back to per-team (atk, dfn) adjustments and
 * blended toward the Elo prior (default 50/50). Edge is then sought in the
 * DERIVED small markets (team totals, BTTS, correct score) that the book prices
 * lazily — not in 1X2, where we are anchored to the sharp line by design.
 *
 * No LLM. Deterministic grid search over lambdas against the devigged targets.
 */

import { DEFAULTS } from '../../app/apps/stea/wc26/lib/engine';

// Sharp / low-margin books available in the Odds API `eu` region.
export const SHARP_BOOKS = new Set([
  'pinnacle', 'betfair_ex_eu', 'matchbook', 'marathonbet', 'betonlineag',
]);

function median(nums) {
  const s = nums.filter((n) => Number.isFinite(n) && n > 1).sort((a, b) => a - b);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/* Multiplicative devig of a set of decimal odds -> fair probabilities. */
function devig(odds) {
  const raw = odds.map((o) => 1 / o);
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map((r) => r / sum);
}

/* Poisson pmf + DC-corrected scoreline probs for a (lamH, lamA) pair. */
function fact(k) { let f = 1; for (let i = 2; i <= k; i++) f *= i; return f; }
function pois(k, l) { return Math.exp(-l) * l ** k / fact(k); }
function dcTau(x, y, lh, la, rho) {
  if (x === 0 && y === 0) return 1 - lh * la * rho;
  if (x === 0 && y === 1) return 1 + lh * rho;
  if (x === 1 && y === 0) return 1 + la * rho;
  if (x === 1 && y === 1) return 1 - rho;
  return 1;
}
/* {pHome,pDraw,pAway,pOver25} for given lambdas — the targets we fit. */
function outcomeProbs(lh, la, rho = DEFAULTS.rho, maxGoals = 10) {
  let home = 0, draw = 0, away = 0, over = 0, s = 0;
  const M = [];
  for (let x = 0; x <= maxGoals; x++) {
    M[x] = [];
    for (let y = 0; y <= maxGoals; y++) {
      const v = pois(x, lh) * pois(y, la) * dcTau(x, y, lh, la, rho);
      M[x][y] = v; s += v;
    }
  }
  for (let x = 0; x <= maxGoals; x++) for (let y = 0; y <= maxGoals; y++) {
    const p = M[x][y] / s;
    if (x > y) home += p; else if (x === y) draw += p; else away += p;
    if (x + y > 2.5) over += p;
  }
  return { home, draw, away, over };
}

/**
 * Solve for the (lamHome, lamAway) that best reproduces the devigged sharp
 * targets. Coarse-to-fine grid search (deterministic, fast, no deps).
 *
 * @param {{home,draw,away,over}} target  devigged sharp probabilities
 * @returns {{lamHome, lamAway, err}}
 */
export function solveLambdas(target) {
  let best = null;
  // coarse grid
  for (let lh = 0.1; lh <= 4.0; lh += 0.1) {
    for (let la = 0.1; la <= 4.0; la += 0.1) {
      const p = outcomeProbs(lh, la);
      const err =
        (p.home - target.home) ** 2 +
        (p.draw - target.draw) ** 2 +
        (p.away - target.away) ** 2 +
        (target.over != null ? (p.over - target.over) ** 2 : 0);
      if (!best || err < best.err) best = { lamHome: lh, lamAway: la, err };
    }
  }
  // refine around the coarse best
  const c = best;
  for (let lh = c.lamHome - 0.1; lh <= c.lamHome + 0.1; lh += 0.02) {
    for (let la = c.lamAway - 0.1; la <= c.lamAway + 0.1; la += 0.02) {
      if (lh <= 0 || la <= 0) continue;
      const p = outcomeProbs(lh, la);
      const err =
        (p.home - target.home) ** 2 +
        (p.draw - target.draw) ** 2 +
        (p.away - target.away) ** 2 +
        (target.over != null ? (p.over - target.over) ** 2 : 0);
      if (err < best.err) best = { lamHome: round3(lh), lamAway: round3(la), err };
    }
  }
  return best;
}

const round3 = (n) => Math.round(n * 1000) / 1000;

/**
 * For one Odds API event, compute the sharp devigged targets and solve lambdas.
 * @returns {{home, away, target, lambdas} | null}  null if no sharp 1X2 available
 */
export function sharpImpliedForEvent(ev) {
  if (!ev || !ev.home_team || !ev.away_team) return null;
  const home = ev.home_team, away = ev.away_team;
  const H = [], D = [], A = [], O = [], U = [];
  for (const bm of ev.bookmakers || []) {
    if (!SHARP_BOOKS.has(bm.key)) continue;
    for (const m of bm.markets || []) {
      if (m.key === 'h2h') for (const o of m.outcomes || []) {
        if (o.name === home) H.push(o.price);
        else if (o.name === away) A.push(o.price);
        else if (o.name === 'Draw') D.push(o.price);
      } else if (m.key === 'totals') for (const o of m.outcomes || []) {
        if (o.point === 2.5 && o.name === 'Over') O.push(o.price);
        if (o.point === 2.5 && o.name === 'Under') U.push(o.price);
      }
    }
  }
  const h = median(H), d = median(D), a = median(A);
  if (!(h && d && a)) return null; // need a sharp 1X2 to calibrate
  const [pH, pD, pA] = devig([h, d, a]);

  let pOver = null;
  const o = median(O), u = median(U);
  if (o && u) { const [po] = devig([o, u]); pOver = po; }

  const target = { home: pH, draw: pD, away: pA, over: pOver };
  const lambdas = solveLambdas(target);
  return { home, away, target, lambdas };
}
