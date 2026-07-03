import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { verifySteaWorkspaceAccess } from '@/lib/steaAccessServer';
import { fetchOpenfootball, parseOpenfootball } from '@/lib/wc26/ingestResults';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ARCTURUSDC_TENANT_ID = 'FqhckqMaorJMAQ6B29mP';

function json(body, status = 200) {
  return NextResponse.json(body, { status });
}

function slug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
function matchId(home, away) {
  return `${slug(home)}-v-${slug(away)}`;
}

/* Load canonical team names that have ratings (so we reconcile, never invent). */
async function loadKnownTeams(db) {
  const snap = await db
    .collection('wc26_teams')
    .where('tenantId', '==', ARCTURUSDC_TENANT_ID)
    .get();
  const names = new Set();
  snap.forEach((doc) => {
    const name = doc.data()?.name;
    if (typeof name === 'string' && name.trim()) names.add(name.trim());
  });
  return names;
}

/* GET — preview only: fetch + parse, write nothing. Lets an admin see yield first. */
export async function GET(request) {
  // Authenticate any signed-in STEa member (no specific-workspace requirement —
  // the data is ArcturusDC-scoped by the hardcoded tenantId below + Firestore
  // rules, matching the page gate). Token or __session cookie both accepted.
  const access = await verifySteaWorkspaceAccess(request);
  if (!access.ok) return json({ error: access.error }, access.status || 403);

  try {
    const { db } = getFirebaseAdmin();
    let known = await loadKnownTeams(db);
    // Fall back to the seed ratings names if teams haven't been seeded yet.
    if (known.size === 0) {
      const seed = (await import('@/app/apps/stea/wc26/data/ratings.json')).default;
      known = new Set(Object.keys(seed));
    }
    const payload = await fetchOpenfootball();
    const parsed = parseOpenfootball(payload, known);
    return json({
      preview: true,
      source: 'openfootball/worldcup.json',
      counts: {
        results: parsed.results.length,
        fixtures: parsed.fixtures.length,
        rejected: parsed.rejected.length,
      },
      missingPriorTeams: [
        ...new Set(
          parsed.rejected
            .filter((r) => r.reason === 'unknown-team')
            .flatMap((r) => r.unknown),
        ),
      ].sort(),
      results: parsed.results,
      fixtures: parsed.fixtures,
    });
  } catch (err) {
    return json({ error: err.message || 'Ingest preview failed.' }, 502);
  }
}

/*
 * POST — write validated REAL results (and fixtures) to Firestore.
 * Results auto-write (low-ambiguity, the model-learning input).
 * Odds are NOT touched here; they come from the separate odds path
 * (The Odds API or manual entry — never an LLM).
 */
export async function POST(request) {
  // Authenticate any signed-in STEa member (no specific-workspace requirement —
  // the data is ArcturusDC-scoped by the hardcoded tenantId below + Firestore
  // rules, matching the page gate). Token or __session cookie both accepted.
  const access = await verifySteaWorkspaceAccess(request);
  if (!access.ok) return json({ error: access.error }, access.status || 403);

  try {
    const { db, FieldValue } = getFirebaseAdmin();
    let known = await loadKnownTeams(db);
    if (known.size === 0) {
      const seed = (await import('@/app/apps/stea/wc26/data/ratings.json')).default;
      known = new Set(Object.keys(seed));
    }

    const payload = await fetchOpenfootball();
    const parsed = parseOpenfootball(payload, known);

    const now = FieldValue.serverTimestamp();
    let resultsWritten = 0;
    let fixturesWritten = 0;
    let fixturesFinalised = 0;
    let batch = db.batch();
    let ops = 0;
    const commitIfFull = async () => {
      if (ops >= 400) { await batch.commit(); batch = db.batch(); ops = 0; }
    };

    // Existing docs, for (a) flipping played fixtures to `final` and (b) the
    // rematch guard: from the QFs / 3rd-place game onward two teams that met
    // earlier can meet again, and the bare `home-v-away` id would silently
    // overwrite the earlier result. A pairing already final on a DIFFERENT
    // date gets a round-qualified id instead.
    const [resSnap, fixSnap] = await Promise.all([
      db.collection('wc26_results').where('tenantId', '==', ARCTURUSDC_TENANT_ID).get(),
      db.collection('wc26_fixtures').where('tenantId', '==', ARCTURUSDC_TENANT_ID).get(),
    ]);
    const resultDates = new Map(resSnap.docs.map((d) => [d.id, d.data().date || null]));
    const fixtureStatus = new Map(fixSnap.docs.map((d) => [d.id, d.data().status || 'scheduled']));

    const resolveId = (home, away, date, roundName) => {
      const base = matchId(home, away);
      const existingDate = resultDates.get(base);
      if (existingDate && date && existingDate !== date) {
        return `${base}-${slug(roundName || 'rematch')}`;
      }
      return base;
    };

    for (const r of parsed.results) {
      const id = resolveId(r.home, r.away, r.date, r.round);
      batch.set(
        db.collection('wc26_results').doc(id),
        {
          tenantId: ARCTURUSDC_TENANT_ID,
          matchId: id,
          home: r.home, away: r.away,
          g1: r.g1, g2: r.g2,
          neutral: r.neutral !== false,
          group: r.group, round: r.round || null, date: r.date,
          status: 'final',
          source: 'openfootball',
          updatedAt: now,
        },
        { merge: true },
      );
      resultDates.set(id, r.date || null);
      resultsWritten++; ops++; await commitIfFull();

      // The game is played: its fixture doc must stop appearing as upcoming.
      if (fixtureStatus.has(id) && fixtureStatus.get(id) !== 'final') {
        batch.set(
          db.collection('wc26_fixtures').doc(id),
          { status: 'final', updatedAt: now },
          { merge: true },
        );
        fixtureStatus.set(id, 'final');
        fixturesFinalised++; ops++; await commitIfFull();
      }
    }

    for (const f of parsed.fixtures) {
      const id = resolveId(f.home, f.away, f.date, f.round);
      // Preserve any existing odds; ingest never overwrites odds.
      batch.set(
        db.collection('wc26_fixtures').doc(id),
        {
          tenantId: ARCTURUSDC_TENANT_ID,
          matchId: id,
          home: f.home, away: f.away,
          neutral: f.neutral !== false,
          group: f.group, round: f.round || null, date: f.date,
          status: 'scheduled',
          source: 'openfootball',
          updatedAt: now,
        },
        { merge: true },
      );
      fixturesWritten++; ops++; await commitIfFull();
    }

    const missingPriorTeams = [
      ...new Set(
        parsed.rejected
          .filter((r) => r.reason === 'unknown-team')
          .flatMap((r) => r.unknown),
      ),
    ].sort();

    batch.set(
      db.collection('wc26_meta').doc('ingest'),
      {
        tenantId: ARCTURUSDC_TENANT_ID,
        source: 'openfootball/worldcup.json',
        resultsWritten, fixturesWritten, fixturesFinalised,
        rejected: parsed.rejected.length,
        missingPriorTeams,
        ranBy: access.user?.email || null,
        updatedAt: now,
      },
      { merge: true },
    );
    ops++;
    await batch.commit();

    return json({
      ok: true,
      resultsWritten,
      fixturesWritten,
      fixturesFinalised,
      rejected: parsed.rejected.length,
      missingPriorTeams,
      note:
        'Real results/fixtures written from openfootball. Run refit + prediction sync to update ratings. Odds are entered separately; ingest never writes odds.',
    });
  } catch (err) {
    return json({ error: err.message || 'Ingest failed.' }, 502);
  }
}
