#!/usr/bin/env node
/*
 * WC26 — seed team ratings from World Football Elo (continuum prior, market-
 * independent). Replaces the coarse 5-tier guesses. Deterministic, no LLM.
 *
 * Updates committed seed files (ratings.json x2) AND Firestore wc26_teams
 * (priorAtk/priorDfn/atk/dfn/elo). Existing gamesPlayed/refit state is reset to
 * the new prior so the shrinkage refit re-applies from a sound base.
 *
 * Run: node scripts/wc26-elo-seed.js
 */
const fs = require('fs');
const path = require('path');
const { getApps, initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const PROJECT_ID = 'stea-775cd';
const TENANT_ID = 'FqhckqMaorJMAQ6B29mP';
const SPREAD = 0.45;

const ALIASES = {
  'Czech Republic': 'Czechia', 'South Korea': 'Korea Republic', 'USA': 'United States',
  'Bosnia & Herzegovina': 'Bosnia and Herzegovina', 'Cape Verde': 'Cabo Verde',
  'Curaçao': 'Curacao', 'IR Iran': 'Iran',
};
const canon = (n) => ALIASES[n] || n;
const slug = (v) => String(v).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const r3 = (n) => Math.round(n * 1000) / 1000;
const tsv = (t) => t.split('\n').map((l) => l.replace(/\r$/, '')).filter(Boolean).map((l) => l.split('\t'));

async function main() {
  // Load current ratings to know the 48-team set + keep tiers for reference.
  const seedPath = path.join(__dirname, '../src/app/apps/stea/wc26/data/ratings.json');
  const ratings = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  const known = new Set(Object.keys(ratings));

  const [w, t] = await Promise.all([
    fetch('https://www.eloratings.net/World.tsv').then((r) => r.text()),
    fetch('https://www.eloratings.net/en.teams.tsv').then((r) => r.text()),
  ]);
  const code2name = {};
  for (const row of tsv(t)) if (row.length >= 2) code2name[row[0]] = row[1];
  const elo = {};
  for (const row of tsv(w)) {
    if (row.length < 4) continue;
    const c = row[2]; const e = Number(row[3]);
    if (!c || !Number.isFinite(e)) continue;
    const name = canon(code2name[c] || c);
    if (known.has(name)) elo[name] = e;
  }
  const matched = Object.keys(elo);
  const missing = [...known].filter((n) => !elo[n]);
  if (missing.length) { console.error('UNMATCHED teams (aborting, no guessing):', missing); process.exit(1); }
  const eloAvg = matched.reduce((s, n) => s + elo[n], 0) / matched.length;
  console.log(`matched ${matched.length}/${known.size} | eloAvg ${Math.round(eloAvg)}`);

  // Build new ratings from Elo.
  const next = {};
  for (const name of Object.keys(ratings)) {
    const z = (elo[name] - eloAvg) / 200;
    next[name] = {
      atk: r3(Math.exp(SPREAD * z)),
      dfn: r3(Math.exp(-SPREAD * z)),
      tier: ratings[name].tier || 'Custom',
      elo: elo[name],
    };
  }

  // Write committed seed files (both copies).
  for (const p of [seedPath, path.join(__dirname, '../functions/wc26/ratings.json')]) {
    fs.writeFileSync(p, JSON.stringify(next, null, 2) + '\n');
    console.log('wrote', p);
  }

  // Update Firestore wc26_teams: prior = atk = Elo-derived; reset refit state.
  if (!getApps().length) initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
  const db = getFirestore();
  const batch = db.batch();
  for (const [name, r] of Object.entries(next)) {
    batch.set(db.collection('wc26_teams').doc(slug(name)), {
      tenantId: TENANT_ID, name,
      atk: r.atk, dfn: r.dfn, priorAtk: r.atk, priorDfn: r.dfn,
      elo: r.elo, tier: r.tier, source: 'elo_prior', gamesPlayed: 0,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }
  await batch.commit();
  console.log('Firestore wc26_teams updated with Elo priors.');
}

main().then(() => process.exit(0)).catch((e) => { console.error('FAILED', e); process.exit(1); });
