#!/usr/bin/env node
/**
 * MLB study — opener-snapshot matching diagnosis (season-1 close review, task 1).
 *
 * The open ~8-11% "unresolvable" item from MLB_BET_SELECTION_FINDINGS.md
 * (2026-09-10 data-quality note, re-confirmed 2026-11-11): when resolving the
 * opener for filter computation via openerPick.capturedAtIso -> exact-match
 * query on mlb_line_snapshots, a slice of EV-gradeable games fails to resolve
 * an opener. T-2h resolves everywhere, so the failure is opener-side only.
 *
 * This script classifies every failure into:
 *   H1  no openerPick on the game doc at all. Sub-causes:
 *       h1_no_snapshots        - no snapshot docs under this gameId
 *       h1_no_consensus        - earliest snapshot lacks usable consensus prices
 *       h1_even_market         - P(Over) exactly 0.5 -> buildPick returns null (no side)
 *       h1_other               - none of the above explains it
 *   H2  openerPick exists but the exact capturedAtIso query returns nothing
 *       (timestamp mismatch, or snapshot written under an orphan doc id)
 *   H3  snapshot found but consensus overDec/underDec unusable
 *
 * For H1 games it also reports RECOVERABILITY: whether an earliest pre-first-
 * pitch snapshot with usable consensus exists — i.e. whether the game would
 * resolve under a pick-record-independent rule ("earliest pre-pitch snapshot
 * per gameId", the same selection finalizeDayImpl uses). F2's definition needs
 * only P(Over) at two snapshots, not a pick record.
 *
 * READ-ONLY. NO SCORING. This script never reads `correct`, `push`,
 * `finalTotal`, or any `pnl`/`ev` outcome field, on any game. It reads
 * predictor prices, timestamps and structural fields only, per
 * MLB_FILTER_REGISTRATION.md (forward windows may not be scored before gate
 * evaluation).
 *
 * USAGE
 *   node scripts/mlb-diagnose-opener-matching.mjs           # summary + per-game table
 */

import {createRequire} from 'module';

const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

const PROJECT_ID = process.env.MLB_PROJECT_ID || 'stea-775cd';
const SANDBOX_END = '2026-08-16'; // registration §1: pre-registration sandbox boundary
const F2_START = '2026-08-17';

admin.initializeApp({projectId: PROJECT_ID});
const db = admin.firestore();

// De-vigged P(Over) — same as functions/mlb/service.js impliedOverProb.
function impliedOverProb(overDec, underDec) {
  if (!Number.isFinite(overDec) || !Number.isFinite(underDec) || overDec <= 0 || underDec <= 0) return null;
  const po = 1 / overDec; const pu = 1 / underDec;
  const total = po + pu;
  return total > 0 ? po / total : null;
}

const usableConsensus = (s) => !!(s && s.consensus &&
  impliedOverProb(s.consensus.overDec, s.consensus.underDec) != null);

async function snapsForGame(gameId) {
  const q = await db.collection('mlb_line_snapshots').where('gameId', '==', gameId).get();
  return q.docs.map((d) => d.data())
    .sort((a, b) => String(a.capturedAtIso).localeCompare(String(b.capturedAtIso)));
}

async function snapExact(gameId, capturedAtIso) {
  const q = await db.collection('mlb_line_snapshots')
    .where('gameId', '==', gameId)
    .where('capturedAtIso', '==', capturedAtIso)
    .limit(1).get();
  return q.empty ? null : q.docs[0].data();
}

// Orphan detection for H2: same timestamp, any gameId.
async function snapsAtTimestamp(capturedAtIso) {
  const q = await db.collection('mlb_line_snapshots')
    .where('capturedAtIso', '==', capturedAtIso).get();
  return q.docs.map((d) => d.data().gameId);
}

const games = await db.collection('mlb_games').get();
const eligible = [];
for (const d of games.docs) {
  const g = d.data();
  if (g.status !== 'final' || !g.date) continue;
  if (!(g.t2hPick && g.t2hPick.evGradeable)) continue;
  eligible.push({
    id: d.id,
    date: g.date,
    window: g.date <= SANDBOX_END ? 'sandbox' : 'forward',
    openCap: g.openerPick ? g.openerPick.capturedAtIso : null,
    hasOpenerPick: !!g.openerPick,
  });
}
eligible.sort((a, b) => a.date.localeCompare(b.date));
console.log(`eligible EV-gradeable finals: ${eligible.length} ` +
  `(sandbox ${eligible.filter((g) => g.window === 'sandbox').length}, ` +
  `forward ${eligible.filter((g) => g.window === 'forward').length})`);

const counts = {}; // window -> cause -> n
const rows = [];
let resolved = 0; let examined = 0;
let h1Recoverable = 0; let h1Total = 0;

for (const g of eligible) {
  examined++;
  if (examined % 100 === 0) process.stderr.write(`...${examined}/${eligible.length}\n`);

  // Current resolution path (pick-record-dependent, exact match)
  if (g.openCap) {
    const snap = await snapExact(g.id, g.openCap);
    if (usableConsensus(snap)) { resolved++; continue; }
    // openerPick exists but did not resolve: H2 or H3
    if (snap) {
      record(g, 'H3_no_usable_consensus', {line: snap.consensus ? snap.consensus.line : null});
      continue;
    }
    const otherIds = await snapsAtTimestamp(g.openCap);
    const orphanIds = otherIds.filter((id) => id !== g.id);
    record(g, orphanIds.length ? 'H2_orphan_gameId' : 'H2_timestamp_missing',
      {orphanIds: orphanIds.slice(0, 3)});
    continue;
  }

  // H1 — no openerPick at all. Establish why, from the snapshots themselves.
  h1Total++;
  const snaps = await snapsForGame(g.id);
  let cause; const detail = {nSnaps: snaps.length};
  if (!snaps.length) {
    cause = 'h1_no_snapshots';
  } else {
    const first = snaps[0]; // finalizeDayImpl's openerSnap = snapDocs[0]
    const p = first.consensus ? impliedOverProb(first.consensus.overDec, first.consensus.underDec) : null;
    if (p == null) cause = 'h1_no_consensus';
    else if (p === 0.5) cause = 'h1_even_market';
    else cause = 'h1_other';
    detail.firstCapturedAtIso = first.capturedAtIso;
    // Recoverability under the pick-record-independent rule: earliest PRE-PITCH
    // snapshot with usable consensus.
    const prePitch = snaps.filter((s) => Number.isFinite(s.minutesToFirstPitch) && s.minutesToFirstPitch >= 0);
    const recoverable = prePitch.length > 0 && usableConsensus(prePitch[0]);
    detail.recoverable = recoverable;
    if (recoverable) h1Recoverable++;
  }
  record(g, cause, detail);
}

function record(g, cause, detail) {
  counts[g.window] = counts[g.window] || {};
  counts[g.window][cause] = (counts[g.window][cause] || 0) + 1;
  rows.push({...g, cause, ...detail});
}

console.log(`\nresolved via current method: ${resolved} of ${eligible.length}`);
console.log('\n--- cause counts by window ---');
for (const w of ['sandbox', 'forward']) {
  console.log(`${w}:`, JSON.stringify(counts[w] || {}, null, 1));
}
console.log(`\nH1 recoverability under earliest-pre-pitch-snapshot rule: ` +
  `${h1Recoverable} of ${h1Total} H1 games recoverable`);

console.log('\n--- per-game table (unresolved only) ---');
console.log('date       | window  | gameId | cause | detail');
for (const r of rows) {
  const detail = r.cause.startsWith('h1') ?
    `nSnaps=${r.nSnaps} recoverable=${r.recoverable ?? 'n/a'}` :
    (r.orphanIds && r.orphanIds.length ? `orphanIds=${r.orphanIds.join(',')}` : JSON.stringify({line: r.line ?? null}));
  console.log(`${r.date} | ${r.window.padEnd(7)} | ${r.id} | ${r.cause} | ${detail}`);
}
console.log('\nNO outcome field (correct/push/finalTotal/pnl/ev) was read or computed.');
process.exit(0);
