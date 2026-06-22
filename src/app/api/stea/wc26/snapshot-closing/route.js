import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { verifySteaWorkspaceAccess } from '@/lib/steaAccessServer';
import { fetchWcOdds } from '@/lib/wc26/oddsApi';
import { TEAM_ALIASES } from '@/lib/wc26/ingestResults';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ARCTURUSDC_TENANT_ID = 'FqhckqMaorJMAQ6B29mP';
// Snapshot the closing line for games kicking off within this window.
const WINDOW_MIN = 75;
const SHARP_BOOKS = new Set(['pinnacle', 'betfair_ex_eu', 'matchbook', 'marathonbet', 'betonlineag']);

function json(body, status = 200) {
  return NextResponse.json(body, { status });
}
function slug(v) {
  return String(v || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
const matchId = (h, a) => `${slug(h)}-v-${slug(a)}`;
const canon = (n) => TEAM_ALIASES[n] || n;

function median(nums) {
  const s = nums.filter((n) => Number.isFinite(n) && n > 1).sort((a, b) => a - b);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
const round2 = (n) => Math.round(n * 100) / 100;
function devigTwo(a, b) { const ia = 1 / a; const ib = 1 / b; return [ia / (ia + ib), ib / (ia + ib)]; }
function devigThree(a, b, c) { const r = [1 / a, 1 / b, 1 / c]; const s = r[0] + r[1] + r[2]; return r.map((x) => x / s); }

/* Sharp-book consensus closing prices (devigged) for one event. */
function closingForEvent(ev) {
  const home = ev.home_team; const away = ev.away_team;
  const H = []; const D = []; const A = []; const O = []; const U = [];
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
  const h = median(H); const d = median(D); const a = median(A);
  if (!(h && d && a)) return null;
  const [pH, pD, pA] = devigThree(h, d, a);
  // CLV is measured vs the devigged (no-vig) closing probability, expressed as
  // fair decimal odds — matching how edges are computed elsewhere.
  const closing = {
    Home: round2(1 / pH), Draw: round2(1 / pD), Away: round2(1 / pA),
  };
  const o = median(O); const u = median(U);
  if (o && u) {
    const [pO, pU] = devigTwo(o, u);
    closing['Over 2.5'] = round2(1 / pO);
    closing['Under 2.5'] = round2(1 / pU);
  }
  return { home: canon(home), away: canon(away), commenceTime: ev.commence_time, closing };
}

/*
 * Snapshot the closing (sharp, devigged) line for fixtures kicking off soon,
 * writing `closingOdds` onto their prediction doc so CLV can be computed at
 * grading. One Odds API pull covers all events; we only call the API when at
 * least one game is in-window (else 0 cost). No LLM.
 */
async function run(request) {
  // Vercel cron sends `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is
  // set; otherwise require an authenticated STEa member (manual button).
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization') || '';
  const isCron = Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`;
  if (!isCron) {
    const access = await verifySteaWorkspaceAccess(request);
    if (!access.ok) return json({ error: access.error }, access.status || 403);
  }

  const apiKey = process.env.WC26_ODDS_API_KEY;
  if (!apiKey) return json({ error: 'WC26_ODDS_API_KEY is not set on the server.' }, 500);

  const { db, FieldValue } = getFirebaseAdmin();
  const now = Date.now();
  const windowMs = WINDOW_MIN * 60 * 1000;

  // Which predictions still need a closing snapshot?
  const predSnap = await db.collection('wc26_predictions')
    .where('tenantId', '==', ARCTURUSDC_TENANT_ID).get();
  const needSnapshot = new Set();
  predSnap.forEach((doc) => {
    const d = doc.data() || {};
    if (!d.closingOdds && !d.grade) needSnapshot.add(d.matchId || doc.id);
  });
  if (needSnapshot.size === 0) {
    return json({ ok: true, snapshotted: 0, note: 'No ungraded predictions awaiting a closing snapshot.' });
  }

  let events;
  try {
    const fetched = await fetchWcOdds(apiKey, { regions: 'eu' });
    events = fetched.events || [];
  } catch (err) {
    return json({ error: err.message || 'Odds API fetch failed.' }, 502);
  }

  let snapshotted = 0;
  const batch = db.batch();
  for (const ev of events) {
    const kt = Date.parse(ev.commence_time);
    if (!Number.isFinite(kt)) continue;
    // only games kicking off within the window (and not already started long ago)
    if (kt - now > windowMs || kt - now < -windowMs) continue;
    const c = closingForEvent(ev);
    if (!c) continue;
    const id = matchId(c.home, c.away);
    if (!needSnapshot.has(id)) continue;
    batch.set(
      db.collection('wc26_predictions').doc(id),
      {
        closingOdds: c.closing,
        closingCommenceTime: c.commenceTime,
        closingSnapshotAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    snapshotted += 1;
  }
  if (snapshotted) await batch.commit();

  return json({ ok: true, snapshotted, windowMin: WINDOW_MIN, candidates: needSnapshot.size });
}

export async function GET(request) { return run(request); }
export async function POST(request) { return run(request); }
