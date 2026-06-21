#!/usr/bin/env node
/*
 * WC26 — purge fabricated / unverified data from Firestore.
 *
 * Removes everything that was derived from invented fixtures/odds or the
 * unverified sample results: wc26_fixtures, wc26_results, wc26_predictions,
 * and the derived wc26_meta docs (summary/predictions/ratings).
 *
 * Leaves wc26_teams (seed priors) and wc26_meta/config in place.
 * Uses Application Default Credentials. Project: stea-775cd.
 *
 * Run:  node scripts/wc26-purge-fabricated.js
 */
const { getApps, initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const PROJECT_ID = 'stea-775cd';
const TENANT_ID = 'FqhckqMaorJMAQ6B29mP';

const COLLECTIONS_TO_CLEAR = ['wc26_fixtures', 'wc26_results', 'wc26_predictions'];
const META_DOCS_TO_DELETE = ['summary', 'predictions', 'ratings'];

if (!getApps().length) {
  initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
}
const db = getFirestore();

async function clearCollection(name) {
  const snap = await db
    .collection(name)
    .where('tenantId', '==', TENANT_ID)
    .get();
  if (snap.empty) {
    console.log(`  ${name}: already empty`);
    return 0;
  }
  let deleted = 0;
  let batch = db.batch();
  let n = 0;
  for (const doc of snap.docs) {
    batch.delete(doc.ref);
    n++;
    deleted++;
    if (n === 400) {
      await batch.commit();
      batch = db.batch();
      n = 0;
    }
  }
  if (n) await batch.commit();
  console.log(`  ${name}: deleted ${deleted} doc(s)`);
  return deleted;
}

async function main() {
  console.log(`Purging fabricated WC26 data from project ${PROJECT_ID} (tenant ${TENANT_ID})`);
  for (const c of COLLECTIONS_TO_CLEAR) {
    await clearCollection(c);
  }
  for (const id of META_DOCS_TO_DELETE) {
    const ref = db.collection('wc26_meta').doc(id);
    const snap = await ref.get();
    if (snap.exists) {
      await ref.delete();
      console.log(`  wc26_meta/${id}: deleted`);
    } else {
      console.log(`  wc26_meta/${id}: not present`);
    }
  }
  console.log('Done. wc26_teams (seed priors) and wc26_meta/config left in place.');
}

main().then(() => process.exit(0)).catch((e) => {
  console.error('Purge failed:', e);
  process.exit(1);
});
