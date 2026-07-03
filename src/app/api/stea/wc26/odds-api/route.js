import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { verifySteaWorkspaceAccess } from '@/lib/steaAccessServer';
import { fetchWcOdds, parseOddsApi } from '@/lib/wc26/oddsApi';
import { sharpImpliedForEvent } from '@/lib/wc26/calibrate';
import { TEAM_ALIASES } from '@/lib/wc26/ingestResults';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ARCTURUSDC_TENANT_ID = 'FqhckqMaorJMAQ6B29mP';

function json(body, status = 200) {
  return NextResponse.json(body, { status });
}
function slug(v) {
  return String(v || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
const matchId = (h, a) => `${slug(h)}-v-${slug(a)}`;

/*
 * Pull UPCOMING WC odds from The Odds API and write consensus prices onto the
 * matching fixtures. No LLM — structured REST source. The validation gate
 * (in parseOddsApi) rejects suspended/in-play events with insane overrounds.
 *
 * GET  = preview (fetch + parse, write nothing)
 * POST = write accepted consensus odds to wc26_fixtures.odds
 */
async function run(write, request) {
  // Driven either by the Firebase scheduler (`Bearer $CRON_SECRET`, same
  // pattern as snapshot-closing) or by a signed-in STEa member (the manual
  // "Pull live odds" button). Data is ArcturusDC-scoped by tenantId + rules.
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization') || '';
  const isCron = Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`;
  let access = { user: null };
  if (!isCron) {
    access = await verifySteaWorkspaceAccess(request);
    if (!access.ok) return json({ error: access.error }, access.status || 403);
  }

  const apiKey = process.env.WC26_ODDS_API_KEY;
  if (!apiKey) {
    return json({ error: 'WC26_ODDS_API_KEY is not set on the server.' }, 500);
  }

  // uk = display odds (consensus shown to user); eu = sharp books for calibration.
  let fetched, sharp;
  try {
    fetched = await fetchWcOdds(apiKey, { regions: 'uk' });
    sharp = await fetchWcOdds(apiKey, { regions: 'eu' });
  } catch (err) {
    return json({ error: err.message || 'Odds API fetch failed.' }, 502);
  }
  const { accepted, rejected } = parseOddsApi(fetched.events);

  // Solve sharp-market-implied lambdas per fixture (the calibration anchor).
  const canon = (n) => TEAM_ALIASES[n] || n;
  const kickoff = {}; // matchId -> ISO commence_time (lets the snapshot job gate on time, 0-cost)
  for (const ev of sharp.events || []) {
    if (ev.commence_time && ev.home_team && ev.away_team) {
      kickoff[matchId(canon(ev.home_team), canon(ev.away_team))] = ev.commence_time;
    }
  }
  const marketLambdas = {}; // matchId -> { lamHome, lamAway, target }
  for (const ev of sharp.events || []) {
    const implied = sharpImpliedForEvent(ev);
    if (!implied || !implied.lambdas) continue;
    const id = matchId(canon(implied.home), canon(implied.away));
    marketLambdas[id] = {
      lamHome: implied.lambdas.lamHome,
      lamAway: implied.lambdas.lamAway,
      sharpHome: +implied.target.home.toFixed(4),
      sharpDraw: +implied.target.draw.toFixed(4),
      sharpAway: +implied.target.away.toFixed(4),
      sharpOver25: implied.target.over != null ? +implied.target.over.toFixed(4) : null,
    };
  }

  if (!write) {
    return json({
      preview: true,
      requestsRemaining: sharp.remaining ?? fetched.remaining,
      acceptedCount: accepted.length,
      rejectedCount: rejected.length,
      calibratedCount: Object.keys(marketLambdas).length,
      rejected,
      accepted,
    });
  }

  // Write consensus odds onto fixtures that exist (don't create new fixtures —
  // results/fixtures come from openfootball; we only attach prices here).
  const { db, FieldValue } = getFirebaseAdmin();
  const now = FieldValue.serverTimestamp();
  let written = 0;
  const unmatched = [];
  let batch = db.batch();
  let ops = 0;

  for (const row of accepted) {
    const id = matchId(row.home, row.away);
    const ref = db.collection('wc26_fixtures').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      unmatched.push(`${row.home} v ${row.away}`);
      continue;
    }
    const ml = marketLambdas[id] || null;
    batch.set(
      ref,
      {
        odds: { ...(snap.data().odds || {}), ...row.odds },
        oddsSource: 'the-odds-api',
        oddsOverround: row.overround ?? null,
        marketLambdas: ml, // sharp-market-implied lambdas for the calibration blend
        kickoff: kickoff[id] || null, // exact UTC kickoff, for the closing-snapshot time gate
        oddsUpdatedAt: now,
        oddsUpdatedBy: isCron ? 'cron' : (access.user?.email || null),
      },
      { merge: true },
    );
    written++; ops++;
    if (ops >= 400) { await batch.commit(); batch = db.batch(); ops = 0; }
  }

  batch.set(
    db.collection('wc26_meta').doc('odds'),
    {
      tenantId: ARCTURUSDC_TENANT_ID,
      source: 'the-odds-api',
      written,
      rejected: rejected.length,
      unmatched,
      requestsRemaining: fetched.remaining,
      ranBy: isCron ? 'cron' : (access.user?.email || null),
      updatedAt: now,
    },
    { merge: true },
  );
  await batch.commit();

  return json({
    ok: true,
    written,
    rejectedCount: rejected.length,
    unmatched,
    requestsRemaining: fetched.remaining,
    note: 'Consensus odds (median across UK books) written to upcoming fixtures. Reload to see value board.',
  });
}

export async function GET(request) {
  return run(false, request);
}
export async function POST(request) {
  return run(true, request);
}
