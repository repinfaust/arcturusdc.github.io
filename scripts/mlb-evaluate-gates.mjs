#!/usr/bin/env node
/**
 * MLB bet-selection — GATE EVALUATION SCRIPT (D-SITE-090).
 *
 * The committed, reviewed implementation of MLB_FILTER_REGISTRATION.md, replacing
 * the 2026-09-10 scratch scorer. Everything evaluative about the 2026 study runs
 * through this file so the one-shot forward tests are never scored by ad-hoc code.
 *
 * WINDOWS
 *   sandbox (default)  games with date <= 2026-08-16 — the pre-registration
 *                      calibration set, permanently gate-ineligible, legal to
 *                      score any number of times.
 *   f2                 games with date >= 2026-08-17 — F2_pmove's ONE-SHOT
 *                      forward test. Scoring it spends it, permanently.
 *   f4b                games with date >= 2026-09-11 — F4b_conf's ONE-SHOT
 *                      forward test. Same.
 *
 * SAFETY — the forward tests cannot be spent by accident:
 *   - Default run scores the sandbox only (hard date <= 2026-08-16 filter).
 *   - A forward run requires BOTH:
 *       --evaluate-gate f2|f4b
 *       --i-understand-one-shot
 *       --confirm "SPEND THE F2 FORWARD TEST"   (or F4B)
 *     with the phrase matching exactly. Anything less refuses and explains.
 *
 * METHOD (frozen before any forward scoring; recorded in the registration's
 * 2026-11-11 additive note and D-SITE-090):
 *   - Eligibility: status 'final', has date, t2hPick.evGradeable === true,
 *     date inside the window (registration §1 / A1).
 *   - P(Over) at full precision via impliedOverProb on snapshot consensus
 *     prices, never the 2dp pOver field (registration §2).
 *   - T-2h snapshot: exact capturedAtIso match on the t2hPick record (the
 *     snapshot the pick was built from; resolves 237/237 in the F4b window).
 *   - OPENER snapshot: earliest pre-first-pitch snapshot with usable consensus,
 *     independent of the pick record — the 2026-11-11 remedy. The old
 *     pick-record resolution silently dropped the ~9% of games whose opener was
 *     priced dead even (P(Over) exactly 0.5 -> buildPick writes no openerPick).
 *     --opener-resolution pick-record reproduces the 2026-09-10 method for
 *     validation against the published sandbox table.
 *   - Filters and thresholds exactly as frozen: theta 0.0274, phi 0.0196,
 *     phi_b 0.0222. F1 still requires an openerPick (an even opener has no
 *     side; F1 is undefined there by design).
 *   - Grading reads the stored, audited t2hPick.correct / push / ev fields
 *     written by finalizeDayImpl. Nothing is regraded here.
 *
 * GATES (operationalised now, blind, per registration §4):
 *   breakeven b = max(0.52381, 1 / mean(worst-book decimal odds of graded sel.))
 *   G1 accuracy    win rate > b
 *   G2 EV          cumulative pnlUnits at CONSENSUS > 0 (flat 1u)
 *   G3 sample      Wilson 95% CI lower bound on win rate > b
 *   G4 stability   selections sorted by date, split into two equal halves;
 *                  BOTH halves: win rate > b AND cumulative pnl at WORST > 0
 *   G5 robustness  cumulative pnlUnits at WORST > 0
 *   Any gate failing => do not bet (a successful result, not a failure).
 *
 * REPORTING: every win rate is printed with n and its Wilson 95% CI; realized
 * selectivity per filter; exclusions counted per cause, never silently dropped;
 * primary results repeated with/without first pitch before 14:00 ET
 * (registration 2026-09-26 note).
 *
 * USAGE
 *   node scripts/mlb-evaluate-gates.mjs --self-test
 *   node scripts/mlb-evaluate-gates.mjs                            # sandbox
 *   node scripts/mlb-evaluate-gates.mjs --opener-resolution pick-record \
 *        --split-date 2026-08-04                                   # 09-10 repro
 *   node scripts/mlb-evaluate-gates.mjs --evaluate-gate f2 \
 *        --i-understand-one-shot --confirm "SPEND THE F2 FORWARD TEST"
 */

import {createRequire} from 'module';

// ─── frozen registration values ───────────────────────────────────────────────
const THETA = 0.0274; // F2_pmove: |P(Over)@T2h - P(Over)@open| (2026-08-16)
const PHI = 0.0196; // F4_conf: |P(Over)@T2h - 0.5| (2026-08-16, exploratory)
const PHI_B = 0.0222; // F4b_conf (2026-09-10, second primary)
const SANDBOX_END = '2026-08-16';
const F2_START = '2026-08-17';
const F4B_START = '2026-09-11';
const BREAKEVEN_110 = 110 / 210; // 0.52381 — risk 110 to win 100

// ─── pure functions ───────────────────────────────────────────────────────────
export function impliedOverProb(overDec, underDec) {
  if (!Number.isFinite(overDec) || !Number.isFinite(underDec) || overDec <= 0 || underDec <= 0) return null;
  const po = 1 / overDec; const pu = 1 / underDec;
  const total = po + pu;
  return total > 0 ? po / total : null;
}

// Wilson 95% score interval on a binomial proportion.
export function wilson(wins, n, z = 1.96) {
  if (!Number.isFinite(wins) || !Number.isFinite(n) || n <= 0) return null;
  const p = wins / n; const z2 = z * z;
  const denom = 1 + z2 / n;
  const centre = p + z2 / (2 * n);
  const spread = z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n);
  return {lo: (centre - spread) / denom, hi: (centre + spread) / denom};
}

// Aggregate a list of selections ({date, push, correct, pnl:{worst,cons,best},
// dec:{worst,cons,best}}) into the reporting row used everywhere below.
export function aggregate(sel) {
  const graded = sel.filter((s) => !s.push && s.correct != null);
  const pushes = sel.filter((s) => s.push).length;
  const wins = graded.filter((s) => s.correct === true).length;
  const sum = (k) => Math.round(sel.reduce((a, s) => a + (Number.isFinite(s.pnl[k]) ? s.pnl[k] : 0), 0) * 100) / 100;
  const meanDec = (k) => {
    const ds = graded.map((s) => s.dec[k]).filter(Number.isFinite);
    return ds.length ? ds.reduce((a, b) => a + b, 0) / ds.length : null;
  };
  const winRate = graded.length ? wins / graded.length : null;
  return {
    selected: sel.length, graded: graded.length, pushes, wins, winRate,
    ci: wilson(wins, graded.length),
    pnl: {worst: sum('worst'), cons: sum('cons'), best: sum('best')},
    meanDec: {worst: meanDec('worst'), cons: meanDec('cons'), best: meanDec('best')},
    roiConsPct: sel.length ? Math.round((sum('cons') / sel.length) * 10000) / 100 : null,
  };
}

// The five gates of registration §4, operationalised per the header.
export function evaluateGates(sel) {
  const agg = aggregate(sel);
  if (!agg.graded) return {agg, breakeven: null, gates: null, pass: false, reason: 'no graded selections'};
  const breakeven = Math.max(BREAKEVEN_110, agg.meanDec.worst ? 1 / agg.meanDec.worst : 0);
  const ordered = sel.slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const mid = Math.floor(ordered.length / 2);
  const halves = [ordered.slice(0, mid), ordered.slice(mid)].map(aggregate);
  const halfOk = (h) => h.graded > 0 && h.winRate > breakeven && h.pnl.worst > 0;
  const gates = {
    g1_accuracy: agg.winRate > breakeven,
    g2_ev: agg.pnl.cons > 0,
    g3_sample: !!agg.ci && agg.ci.lo > breakeven,
    g4_stability: halfOk(halves[0]) && halfOk(halves[1]),
    g5_robustness: agg.pnl.worst > 0,
  };
  return {agg, breakeven, halves, gates, pass: Object.values(gates).every(Boolean)};
}

const pct = (x) => (x == null ? 'n/a' : (x * 100).toFixed(1) + '%');
const ciStr = (ci) => (ci ? `${(ci.lo * 100).toFixed(1)} - ${(ci.hi * 100).toFixed(1)}` : 'n/a');

// ─── self-test (no Firestore, synthetic fixtures only) ────────────────────────
function selfTest() {
  let failures = 0;
  const check = (name, got, want, tol = 0) => {
    const ok = tol ? Math.abs(got - want) <= tol : got === want;
    if (!ok) { failures++; console.error(`FAIL ${name}: got ${got}, want ${want}`); } else console.log(`ok   ${name}`);
  };

  // impliedOverProb: symmetric prices -> exactly 0.5; null on junk.
  check('iop even', impliedOverProb(1.91, 1.91), 0.5);
  check('iop null', impliedOverProb(null, 1.91), null);
  check('iop favours over', impliedOverProb(1.8, 2.0) > 0.5, true);

  // wilson: cross-checked against the published sandbox row — F0_all, 138/268
  // wins (51.5%), CI 45.5-57.4 per MLB_BET_SELECTION_FINDINGS.md 2026-09-10.
  const w = wilson(138, 268);
  check('wilson lo (F0 row)', w.lo, 0.455, 0.003);
  check('wilson hi (F0 row)', w.hi, 0.574, 0.003);
  check('wilson narrows with n', wilson(550, 1000).hi - wilson(550, 1000).lo < w.hi - w.lo, true);
  check('wilson null on n=0', wilson(0, 0), null);

  // aggregate: 3 wins at 2.0, 1 loss, 1 push -> pnl +2, winRate .75
  const mk = (correct, push, dec = 2.0) => ({
    date: '2026-08-20', correct, push,
    pnl: {worst: push ? 0 : correct ? dec - 1 : -1, cons: push ? 0 : correct ? dec - 1 : -1, best: push ? 0 : correct ? dec - 1 : -1},
    dec: {worst: dec, cons: dec, best: dec},
  });
  const agg = aggregate([mk(true, false), mk(true, false), mk(true, false), mk(false, false), mk(null, true)]);
  check('agg graded', agg.graded, 4);
  check('agg pushes', agg.pushes, 1);
  check('agg winRate', agg.winRate, 0.75);
  check('agg pnl cons', agg.pnl.cons, 2);

  // gates: a clearly winning set passes all five; one bad half fails G4 only.
  const winner = (date) => ({...mk(true, false, 1.95), date});
  const loser = (date) => ({...mk(false, false, 1.95), date});
  const good = [];
  for (let i = 0; i < 300; i++) good.push(i % 5 === 4 ? loser(`2026-08-${(i % 28) + 1}`) : winner(`2026-08-${(i % 28) + 1}`));
  const gw = evaluateGates(good);
  check('gates all pass on 80% winner', gw.pass, true);
  const skew = [];
  for (let i = 0; i < 150; i++) skew.push(winner('2026-08-01'));
  for (let i = 0; i < 150; i++) skew.push(i % 2 ? winner('2026-09-01') : loser('2026-09-01'));
  const gs = evaluateGates(skew);
  check('G4 fails on one-half edge', gs.gates.g4_stability, false);
  check('G1 still passes on skewed set', gs.gates.g1_accuracy, true);

  // breakeven: at exactly -110 (decimal 21/11) the floor binds; worse odds raise it.
  check('breakeven value', BREAKEVEN_110, 0.5238, 0.0001);
  check('breakeven floor', Math.max(BREAKEVEN_110, 1 / (21 / 11)), BREAKEVEN_110, 1e-9);
  check('breakeven raised at -120', 1 / 1.833 > BREAKEVEN_110, true);

  console.log(failures ? `\nSELF-TEST FAILED: ${failures} failure(s)` : '\nSELF-TEST PASSED: all checks ok');
  process.exit(failures ? 1 : 0);
}

// ─── CLI ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, dflt = null) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] != null ? args[i + 1] : dflt;
};

if (flag('--self-test')) selfTest();

const gateTarget = opt('--evaluate-gate'); // f2 | f4b | null
const openerResolution = opt('--opener-resolution', 'earliest-prepitch'); // | pick-record
const splitDate = opt('--split-date'); // optional fixed split for sandbox repro

if (gateTarget) {
  const phrase = gateTarget === 'f2' ? 'SPEND THE F2 FORWARD TEST' :
    gateTarget === 'f4b' ? 'SPEND THE F4B FORWARD TEST' : null;
  if (!phrase) { console.error(`unknown gate target '${gateTarget}' (f2|f4b)`); process.exit(1); }
  if (!flag('--i-understand-one-shot') || opt('--confirm') !== phrase) {
    console.error(
      `REFUSED. ${gateTarget.toUpperCase()}'s forward test is ONE-SHOT: scoring it spends it, permanently\n` +
      `(MLB_FILTER_REGISTRATION.md §0/§4). To proceed you must pass BOTH:\n` +
      `  --i-understand-one-shot --confirm "${phrase}"\n` +
      `Nothing was read or computed.`);
    process.exit(1);
  }
}

const windowName = gateTarget || 'sandbox';
const WINDOWS = {
  sandbox: {from: null, to: SANDBOX_END, primary: 'F2_pmove', label: `sandbox (<= ${SANDBOX_END}, gate-ineligible)`},
  f2: {from: F2_START, to: null, primary: 'F2_pmove', label: `F2 forward window (>= ${F2_START})`},
  f4b: {from: F4B_START, to: null, primary: 'F4b_conf', label: `F4b forward window (>= ${F4B_START})`},
};
const W = WINDOWS[windowName];

// ─── data load ────────────────────────────────────────────────────────────────
const require = createRequire(import.meta.url);
const admin = require('firebase-admin');
admin.initializeApp({projectId: process.env.MLB_PROJECT_ID || 'stea-775cd'});
const db = admin.firestore();

const nyHour = (iso) => {
  if (!iso) return null;
  const h = new Date(iso).toLocaleString('en-US', {timeZone: 'America/New_York', hour: '2-digit', hour12: false});
  const n = Number(h);
  return Number.isFinite(n) ? n : null;
};

async function snapsForGame(gameId) {
  const q = await db.collection('mlb_line_snapshots').where('gameId', '==', gameId).get();
  return q.docs.map((d) => d.data())
    .sort((a, b) => String(a.capturedAtIso).localeCompare(String(b.capturedAtIso)));
}

console.log(`window: ${W.label} | opener resolution: ${openerResolution} | primary: ${W.primary}`);
if (gateTarget) console.log('*** THIS RUN SPENDS THE FORWARD TEST. Results go verbatim into MLB_BET_SELECTION_FINDINGS.md. ***');

const gamesSnap = await db.collection('mlb_games').get();
const eligible = [];
const excl = {not_final_or_no_date: 0, not_ev_gradeable: 0, outside_window: 0};
for (const d of gamesSnap.docs) {
  const g = d.data();
  if (g.status !== 'final' || !g.date) { excl.not_final_or_no_date++; continue; }
  if (W.from && g.date < W.from) { excl.outside_window++; continue; }
  if (W.to && g.date > W.to) { excl.outside_window++; continue; }
  if (!(g.t2hPick && g.t2hPick.evGradeable)) { excl.not_ev_gradeable++; continue; }
  eligible.push({id: d.id, g});
}
console.log(`eligible: ${eligible.length} | excluded: ${JSON.stringify(excl)}`);

const records = [];
const unresolved = {t2h_snapshot: 0, t2h_consensus: 0, opener: 0, ev_missing: 0};
let done = 0;
for (const {id, g} of eligible) {
  done++;
  if (done % 100 === 0) process.stderr.write(`...${done}/${eligible.length}\n`);
  const snaps = await snapsForGame(id);
  const t2h = snaps.find((s) => s.capturedAtIso === g.t2hPick.capturedAtIso) || null;
  if (!t2h) { unresolved.t2h_snapshot++; continue; }
  const pT = t2h.consensus ? impliedOverProb(t2h.consensus.overDec, t2h.consensus.underDec) : null;
  if (pT == null) { unresolved.t2h_consensus++; continue; }

  let openSnap = null;
  if (openerResolution === 'pick-record') {
    openSnap = g.openerPick ? snaps.find((s) => s.capturedAtIso === g.openerPick.capturedAtIso) || null : null;
  } else {
    const pre = snaps.filter((s) => Number.isFinite(s.minutesToFirstPitch) && s.minutesToFirstPitch >= 0);
    openSnap = pre.find((s) => s.consensus && impliedOverProb(s.consensus.overDec, s.consensus.underDec) != null) || null;
  }
  const pO = openSnap && openSnap.consensus ? impliedOverProb(openSnap.consensus.overDec, openSnap.consensus.underDec) : null;
  if (pO == null) { unresolved.opener++; continue; }

  const ev = g.t2hPick.ev;
  const v = (k) => (ev && ev[k] ? ev[k] : null);
  if (!v('worst') || !v('consensus') || !v('best')) { unresolved.ev_missing++; continue; }

  records.push({
    date: g.date,
    earlyPitch: (() => { const h = nyHour(g.scheduledFirstPitch); return h != null ? h < 14 : null; })(),
    push: g.t2hPick.push === true,
    correct: g.t2hPick.push ? null : g.t2hPick.correct,
    pnl: {worst: v('worst').pnlUnits, cons: v('consensus').pnlUnits, best: v('best').pnlUnits},
    dec: {worst: v('worst').priceDecimal, cons: v('consensus').priceDecimal, best: v('best').priceDecimal},
    deltaP: Math.abs(pT - pO),
    conf: Math.abs(pT - 0.5),
    sidesDiffer: !!(g.openerPick && g.openerPick.side && g.t2hPick.side && g.openerPick.side !== g.t2hPick.side),
    hasOpenerPick: !!g.openerPick,
    pitcherChanged: g.pitcherChangedBeforeT2h === true,
  });
}

console.log(`resolvable: ${records.length} | unresolved: ${JSON.stringify(unresolved)}`);

const FILTERS = {
  F0_all: () => true,
  F1_revision: (r) => r.hasOpenerPick && r.sidesDiffer,
  F2_pmove: (r) => r.deltaP >= THETA,
  F3_pitcher: (r) => r.pitcherChanged,
  F4_conf: (r) => r.conf >= PHI,
  F5_combo: (r) => r.deltaP >= THETA && r.conf >= PHI,
  ...(windowName === 'f4b' ? {F4b_conf: (r) => r.conf >= PHI_B} : {}),
};

console.log('\n--- correct-side accuracy, T-2h pick (breakeven 52.4% at -110) ---');
console.log('filter | selected | graded | pushes | win% | 95% CI (Wilson) | selectivity');
const selections = {};
for (const [name, fn] of Object.entries(FILTERS)) {
  const sel = records.filter(fn);
  selections[name] = sel;
  const a = aggregate(sel);
  console.log(`${name} | ${a.selected} | ${a.graded} | ${a.pushes} | ${pct(a.winRate)} | ${ciStr(a.ci)} | ${pct(a.selected / records.length)}`);
}

console.log('\n--- realized P&L, flat 1u, real prices after vig ---');
console.log('filter | bets | worst | consensus | best | mean dec (cons) | ROI% (cons)');
for (const [name, sel] of Object.entries(selections)) {
  const a = aggregate(sel);
  console.log(`${name} | ${a.selected} | ${a.pnl.worst > 0 ? '+' : ''}${a.pnl.worst} | ${a.pnl.cons > 0 ? '+' : ''}${a.pnl.cons} | ${a.pnl.best > 0 ? '+' : ''}${a.pnl.best} | ${a.meanDec.cons ? a.meanDec.cons.toFixed(3) : 'n/a'} | ${a.roiConsPct}`);
}

// Split-table semantics match the published 2026-09-10 table: n is the GRADED
// count, and with --split-date D, H1 is games strictly before D (the published
// "split date 2026-08-04" assigned 08-04 itself to H2).
console.log(`\n--- stability split${splitDate ? ` (fixed date ${splitDate}, H1 < date)` : ' (equal halves by date order)'} ---`);
console.log('filter | H1 n(graded) | H1 win% | H1 pnl(cons) | H2 n(graded) | H2 win% | H2 pnl(cons)');
for (const [name, sel] of Object.entries(selections)) {
  const ordered = sel.slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
  let h1; let h2;
  if (splitDate) { h1 = ordered.filter((s) => s.date < splitDate); h2 = ordered.filter((s) => s.date >= splitDate); } else {
    const mid = Math.floor(ordered.length / 2);
    h1 = ordered.slice(0, mid); h2 = ordered.slice(mid);
  }
  const [a1, a2] = [aggregate(h1), aggregate(h2)];
  console.log(`${name} | ${a1.graded} | ${pct(a1.winRate)} | ${a1.pnl.cons} | ${a2.graded} | ${pct(a2.winRate)} | ${a2.pnl.cons}`);
}

// Primary with/without early first pitches (registration 2026-09-26 note).
const primarySel = selections[W.primary] || [];
console.log(`\n--- ${W.primary}: first-pitch composition (registration 2026-09-26 note) ---`);
for (const [label, subset] of [
  ['all', primarySel],
  ['first pitch >= 14:00 ET', primarySel.filter((s) => s.earlyPitch === false)],
  ['first pitch < 14:00 ET', primarySel.filter((s) => s.earlyPitch === true)],
  ['first pitch time unknown', primarySel.filter((s) => s.earlyPitch == null)],
]) {
  const a = aggregate(subset);
  console.log(`${label}: n=${a.selected}, graded=${a.graded}, win% ${pct(a.winRate)}, CI ${ciStr(a.ci)}, pnl(cons) ${a.pnl.cons}`);
}

if (gateTarget) {
  console.log(`\n=== GATE EVALUATION — ${W.primary} (ONE-SHOT, now spent) ===`);
  const res = evaluateGates(primarySel);
  console.log(`breakeven (max of 52.38% and 1/mean worst dec): ${pct(res.breakeven)}`);
  if (res.gates) {
    for (const [k, v] of Object.entries(res.gates)) console.log(`${k}: ${v ? 'PASS' : 'FAIL'}`);
    console.log(`\nVERDICT: ${res.pass ? 'ALL FIVE GATES PASS — a staking DISCUSSION may begin (spec §6); nothing is authorised by this output.' : 'DO NOT BET — at least one gate failed. Per spec §7 this is a successful result.'}`);
  } else {
    console.log(`VERDICT: DO NOT BET — ${res.reason}.`);
  }
  console.log('Paste this output verbatim into MLB_BET_SELECTION_FINDINGS.md with the run date.');
} else {
  console.log('\nNo gate evaluated (sandbox is permanently gate-ineligible, registration §1).');
}
process.exit(0);
