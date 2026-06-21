#!/usr/bin/env node
/*
 * WC26 one-off live refresh (admin, ADC). Deterministic, no LLM.
 *  1. Re-seed the 48 team priors; remove any team no longer in the seed (e.g. Denmark).
 *  2. Fetch real results/fixtures from the pinned openfootball source, validate,
 *     reconcile to known teams, write wc26_results / wc26_fixtures.
 *  3. Run the deterministic shrinkage refit (functions/wc26/service.refitWc26RatingsImpl)
 *     to update wc26_teams from observed results.
 *
 * Run: node scripts/wc26-live-refresh.js
 */
const { getApps, initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const PROJECT_ID = 'stea-775cd';
const TENANT_ID = 'FqhckqMaorJMAQ6B29mP';
const SOURCE_URL =
  'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';

const seedRatings = require('../functions/wc26/ratings.json');

const TEAM_ALIASES = {
  'Czech Republic': 'Czechia',
  'South Korea': 'Korea Republic',
  'USA': 'United States',
  'Bosnia & Herzegovina': 'Bosnia and Herzegovina',
  'Cape Verde': 'Cabo Verde',
  'Curaçao': 'Curacao',
};
const isPlaceholder = (n) => /^[0-9]/.test(n) || /^[WL]\d+$/.test(n) || n.includes('/');
const canon = (n) => TEAM_ALIASES[n] || n;
const slug = (v) => String(v || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const matchId = (h, a) => `${slug(h)}-v-${slug(a)}`;

if (!getApps().length) {
  initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
}
const db = getFirestore();

async function reseedTeams() {
  const known = new Set(Object.keys(seedRatings));
  // delete teams no longer in the seed
  const snap = await db.collection('wc26_teams').where('tenantId', '==', TENANT_ID).get();
  const batch = db.batch();
  let removed = 0;
  snap.forEach((doc) => {
    const name = doc.data()?.name;
    if (name && !known.has(name)) { batch.delete(doc.ref); removed++; }
  });
  // upsert all seed teams
  for (const [name, r] of Object.entries(seedRatings)) {
    batch.set(db.collection('wc26_teams').doc(slug(name)), {
      tenantId: TENANT_ID, name,
      atk: Number(r.atk), dfn: Number(r.dfn),
      priorAtk: Number(r.priorAtk || r.atk), priorDfn: Number(r.priorDfn || r.dfn),
      tier: r.tier || 'Custom', source: 'seed', gamesPlayed: 0,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }
  await batch.commit();
  console.log(`teams: upserted ${Object.keys(seedRatings).length}, removed ${removed} stale`);
  return known;
}

async function ingest(known) {
  const res = await fetch(SOURCE_URL, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`source HTTP ${res.status}`);
  const payload = await res.json();
  const batch = db.batch();
  let results = 0, fixtures = 0;
  const missing = new Set();
  for (const m of payload.matches) {
    const t1 = (m.team1 || '').trim(), t2 = (m.team2 || '').trim();
    if (!t1 || !t2 || isPlaceholder(t1) || isPlaceholder(t2)) continue;
    const home = canon(t1), away = canon(t2);
    if (!known.has(home) || !known.has(away)) {
      if (!known.has(home)) missing.add(t1);
      if (!known.has(away)) missing.add(t2);
      continue;
    }
    const id = matchId(home, away);
    const ft = m.score && m.score.ft;
    const played = Array.isArray(ft) && ft.length === 2 && Number.isInteger(ft[0]) && Number.isInteger(ft[1]);
    if (played) {
      batch.set(db.collection('wc26_results').doc(id), {
        tenantId: TENANT_ID, matchId: id, home, away, g1: ft[0], g2: ft[1],
        neutral: true, group: m.group || null, date: m.date || null,
        status: 'final', source: 'openfootball', updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      results++;
    } else {
      batch.set(db.collection('wc26_fixtures').doc(id), {
        tenantId: TENANT_ID, matchId: id, home, away,
        neutral: true, group: m.group || null, date: m.date || null,
        status: 'scheduled', source: 'openfootball', updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      fixtures++;
    }
  }
  await batch.commit();
  console.log(`ingest: ${results} results, ${fixtures} fixtures written; missing priors: ${[...missing].join(', ') || 'none'}`);
}

async function main() {
  console.log(`WC26 live refresh — project ${PROJECT_ID}`);
  const known = await reseedTeams();
  await ingest(known);
  // deterministic shrinkage refit (reuses the deployed function logic)
  // Deterministic shrinkage refit using the pure exported function (no admin dep),
  // then write updated ratings back with THIS script's initialized admin app.
  const { refitRatingsFromResults } = require('../functions/wc26/service');
  const ratingsSnap = await db.collection('wc26_teams').where('tenantId', '==', TENANT_ID).get();
  const ratings = {};
  ratingsSnap.forEach((d) => {
    const x = d.data();
    ratings[x.name] = { atk: x.atk, dfn: x.dfn, tier: x.tier, priorAtk: x.priorAtk, priorDfn: x.priorDfn };
  });
  const resSnap = await db.collection('wc26_results').where('tenantId', '==', TENANT_ID).get();
  const results = resSnap.docs.map((d) => d.data());
  const refit = refitRatingsFromResults(ratings, results);
  const rb = db.batch();
  for (const [name, r] of Object.entries(refit.ratings)) {
    rb.set(db.collection('wc26_teams').doc(slug(name)), {
      atk: Number(r.atk), dfn: Number(r.dfn),
      priorAtk: Number(r.priorAtk), priorDfn: Number(r.priorDfn),
      gamesPlayed: Number(r.gamesPlayed || 0),
      source: 'deterministic_shrinkage_refit', updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }
  await rb.commit();
  console.log(`refit: updated ${Object.keys(refit.ratings).length} teams from ${refit.games} games`);
  console.log('Done. (Predictions sync runs via the deployed scheduled function.)');
}

main().then(() => process.exit(0)).catch((e) => { console.error('FAILED:', e); process.exit(1); });
