#!/usr/bin/env node
/**
 * MLB study backfill — corrects contaminated closing lines (D-SITE-014) and
 * derives per-pick price + realized EV (D-SITE-015) for already-finalized games.
 *
 * Both corrections are pure recomputations from line snapshots already held in
 * Firestore. NO Odds API calls are made and no new data is collected — this
 * script cannot spend an API credit.
 *
 * D-SITE-014: `close` was taken from the last snapshot of any time, including
 * snapshots captured after first pitch (live in-play prices). The closing line is
 * the last price before first pitch. 288 of 408 finals held a wrong value.
 *
 * D-SITE-015: adds `ev` (best/worst/consensus price + pnlUnits) to each pick from
 * the per-book prices already stored on every snapshot.
 *
 * SAFETY
 *   - Dry-run by default. Writes only with --apply.
 *   - Idempotent: a second run is a no-op (already-correct docs are skipped).
 *   - Auditable: stores closePreFixValue / closeBackfilledAt on touched docs.
 *   - Never recomputes openerPick/t2hPick side/correct — those are correct and are
 *     read as-is. Only `ev` is attached to them.
 *   - No price is ever imputed. A pick with no real book quote at its own line is
 *     recorded evGradeable:false and excluded from EV.
 *
 * USAGE
 *   node scripts/mlb-backfill-close-and-ev.mjs            # dry run, prints diff
 *   node scripts/mlb-backfill-close-and-ev.mjs --apply    # writes
 *   node scripts/mlb-backfill-close-and-ev.mjs --limit 20 # sample first
 */

import admin from 'firebase-admin';
import {createRequire} from 'module';

const require = createRequire(import.meta.url);
const {buildPickEv, round2: _r} = require('../functions/mlb/service.js');

const PROJECT_ID = process.env.MLB_PROJECT_ID || 'stea-775cd';
const TENANT_ID = 'FqhckqMaorJMAQ6B29mP';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const limitArg = args.indexOf('--limit');
const LIMIT = limitArg >= 0 ? Number(args[limitArg + 1]) : null;

admin.initializeApp({projectId: PROJECT_ID});
const db = admin.firestore();

const round2 = (n) => (Number.isFinite(n) ? Math.round(n * 100) / 100 : null);

async function main() {
  console.log(`MLB backfill — project ${PROJECT_ID} — ${APPLY ? 'APPLY (writing)' : 'DRY RUN (no writes)'}`);

  const gamesSnap = await db.collection('mlb_games').where('tenantId', '==', TENANT_ID).get();
  const games = gamesSnap.docs.map((d) => ({id: d.id, ...d.data()}));
  const finals = games.filter((g) => g.finalTotal != null);
  console.log(`games: ${games.length} | finalized: ${finals.length}`);

  // Load all snapshots once, grouped by gameId — one read pass, not one per game.
  const snapsSnap = await db.collection('mlb_line_snapshots').where('tenantId', '==', TENANT_ID).get();
  const byGame = {};
  snapsSnap.forEach((d) => {
    const s = d.data();
    (byGame[s.gameId] = byGame[s.gameId] || []).push(s);
  });
  console.log(`snapshots: ${snapsSnap.size} across ${Object.keys(byGame).length} games\n`);

  const target = LIMIT ? finals.slice(0, LIMIT) : finals;
  const stats = {
    closeFixed: 0, closeAlreadyCorrect: 0, noPreGameSnaps: 0,
    evAdded: 0, evUngradeable: 0, unchanged: 0, written: 0,
  };
  const diffs = [];

  for (const g of target) {
    const snaps = (byGame[g.id] || []).slice()
      .sort((a, b) => String(a.capturedAtIso).localeCompare(String(b.capturedAtIso)));
    if (!snaps.length) continue;

    const preGame = snaps.filter((s) => Number.isFinite(s.minutesToFirstPitch) && s.minutesToFirstPitch >= 0);
    if (!preGame.length) {
      // Fail closed: no pre-game snapshot means no closing line. Leave the doc alone
      // rather than substituting an in-play price.
      stats.noPreGameSnaps++;
      continue;
    }

    const closeSnap = preGame[preGame.length - 1];
    const trueClose = closeSnap.consensus ? closeSnap.consensus.line : null;
    const storedClose = g.close ? g.close.line : null;
    const closeWrong = trueClose != null && storedClose !== trueClose;

    // Rebuild EV for whichever picks exist. Pick side/correct are NOT recomputed.
    const openerSnap = snaps[0] || null;
    const t2hSnap = snaps
      .filter((s) => Number.isFinite(s.minutesToFirstPitch) && s.minutesToFirstPitch >= 100 && s.minutesToFirstPitch <= 140)
      .sort((a, b) => Math.abs(a.minutesToFirstPitch - 120) - Math.abs(b.minutesToFirstPitch - 120))[0] || null;

    const openerEv = g.openerPick ? buildPickEv(openerSnap, g.openerPick) : null;
    const t2hEv = g.t2hPick ? buildPickEv(t2hSnap, g.t2hPick) : null;

    const needsEv = (g.openerPick && g.openerPick.ev === undefined) || (g.t2hPick && g.t2hPick.ev === undefined);
    if (!closeWrong && !needsEv) {
      stats.unchanged++;
      continue;
    }

    if (closeWrong) {
      stats.closeFixed++;
      diffs.push({
        id: g.id, date: g.date, stored: storedClose, correct: trueClose,
        diff: round2((storedClose ?? 0) - trueClose),
        lastSnapMins: snaps[snaps.length - 1].minutesToFirstPitch,
      });
    } else if (trueClose != null) {
      stats.closeAlreadyCorrect++;
    }

    if (openerEv || t2hEv) stats.evAdded++;
    else if (g.openerPick || g.t2hPick) stats.evUngradeable++;

    const opener = g.opener ? g.opener.line : null;
    const payload = {
      close: {line: trueClose, capturedAt: closeSnap.capturedAtIso},
      moveSummary: (opener != null && trueClose != null) ? {
        delta: round2(trueClose - opener),
        nSnapshots: snaps.length,
        nEvents: g.moveSummary ? g.moveSummary.nEvents : 0,
        openerToActual: round2(g.finalTotal - opener),
      } : (g.moveSummary || null),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (g.openerPick) payload.openerPick = {...g.openerPick, ev: openerEv, evGradeable: !!openerEv};
    if (g.t2hPick) payload.t2hPick = {...g.t2hPick, ev: t2hEv, evGradeable: !!t2hEv};

    // Audit trail — recorded once, on first correction only, so re-runs cannot
    // overwrite the original pre-fix value with an already-fixed one.
    if (closeWrong && g.closeBackfilledAt == null) {
      payload.closePreFixValue = storedClose;
      payload.closeBackfilledAt = admin.firestore.FieldValue.serverTimestamp();
      payload.closeBackfillNote = 'D-SITE-014: close was an in-play price; corrected to last pre-first-pitch snapshot';
    }

    if (APPLY) {
      await db.collection('mlb_games').doc(g.id).set(payload, {merge: true});
      stats.written++;
    }
  }

  diffs.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  console.log('Worst 20 closing-line corrections (stored -> correct):');
  diffs.slice(0, 20).forEach((d) =>
    console.log(`  ${d.date}  ${d.id}  ${d.stored} -> ${d.correct}  (off by ${d.diff}, last snapshot mins=${d.lastSnapMins})`));

  console.log('\n--- summary ---');
  console.log(`close corrected      : ${stats.closeFixed}`);
  console.log(`close already correct: ${stats.closeAlreadyCorrect}`);
  console.log(`no pre-game snapshot : ${stats.noPreGameSnaps} (skipped, fail-closed)`);
  console.log(`ev added             : ${stats.evAdded}`);
  console.log(`ev ungradeable       : ${stats.evUngradeable} (no real book price at pick line — never imputed)`);
  console.log(`unchanged            : ${stats.unchanged}`);
  console.log(`docs written         : ${stats.written}${APPLY ? '' : '  (dry run — re-run with --apply)'}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('backfill failed:', err);
  process.exit(1);
});
