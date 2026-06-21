import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { verifySteaWorkspaceAccess } from '@/lib/steaAccessServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ARCTURUSDC_TENANT_ID = 'FqhckqMaorJMAQ6B29mP';
const ALLOWED_WORKSPACES = ['ArcturusDC'];

/* Engine market-key selections we accept odds for. Keys MUST match engine.js. */
const VALID_SELECTIONS = new Set([
  'Home', 'Draw', 'Away',
  'Over 1.5', 'Under 1.5', 'Over 2.5', 'Under 2.5', 'Over 3.5', 'Under 3.5',
  'BTTS Yes', 'BTTS No',
  'Home Over 0.5', 'Home Over 1.5', 'Home Over 2.5',
  'Away Over 0.5', 'Away Over 1.5', 'Away Over 2.5',
  'Home -1.50', 'Home -0.50', 'Home +0.50', 'Home +1.50',
]);

function json(body, status = 200) {
  return NextResponse.json(body, { status });
}

/*
 * POST { matchId, odds: { "<selection>": <decimal> } }
 *
 * Deterministic validation gate (the source-agnostic safety boundary — applies
 * whether odds were typed by hand or extracted later by an LLM):
 *   - selection must be a known engine market key
 *   - decimal odds must be a finite number > 1.0 and < 1000
 * Invalid entries are rejected and reported; only valid ones are written.
 * Odds are MERGED into the fixture (never wipes existing odds unless replaced).
 */
export async function POST(request) {
  const access = await verifySteaWorkspaceAccess(request, {
    tenantId: ARCTURUSDC_TENANT_ID,
    allowedWorkspaceNames: ALLOWED_WORKSPACES,
  });
  if (!access.ok) return json({ error: access.error }, access.status || 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const matchId = typeof body?.matchId === 'string' ? body.matchId.trim() : '';
  if (!matchId) return json({ error: 'matchId is required.' }, 400);
  if (!body?.odds || typeof body.odds !== 'object') {
    return json({ error: 'odds object is required.' }, 400);
  }

  const accepted = {};
  const rejected = [];
  for (const [sel, raw] of Object.entries(body.odds)) {
    if (!VALID_SELECTIONS.has(sel)) {
      rejected.push({ selection: sel, reason: 'unknown-market-key' });
      continue;
    }
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 1 || n >= 1000) {
      rejected.push({ selection: sel, reason: 'odds-out-of-range', value: raw });
      continue;
    }
    accepted[sel] = Math.round(n * 100) / 100;
  }

  if (Object.keys(accepted).length === 0) {
    return json({ error: 'No valid odds to write.', rejected }, 400);
  }

  try {
    const { db, FieldValue } = getFirebaseAdmin();
    const ref = db.collection('wc26_fixtures').doc(matchId);
    const snap = await ref.get();
    if (!snap.exists) return json({ error: `Fixture not found: ${matchId}` }, 404);

    const existingOdds = snap.data().odds || {};
    await ref.set(
      {
        odds: { ...existingOdds, ...accepted },
        oddsSource: body.source || 'manual',
        oddsUpdatedAt: FieldValue.serverTimestamp(),
        oddsUpdatedBy: access.user?.email || null,
      },
      { merge: true },
    );

    return json({ ok: true, matchId, written: Object.keys(accepted).length, accepted, rejected });
  } catch (err) {
    return json({ error: err.message || 'Failed to write odds.' }, 502);
  }
}
