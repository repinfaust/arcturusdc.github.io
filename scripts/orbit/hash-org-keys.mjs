#!/usr/bin/env node
/**
 * Orbit K1 migration (D-SITE-047): replace every plaintext org `apiKey` in `orbit_orgs` with its
 * sha256 hash, then delete the plaintext. Keys keep working: callers send the same key, and
 * src/lib/orbit/orgKeys.js compares hashes.
 *
 * SAFETY
 *   - Dry run by default. Writes only with --apply.
 *   - Idempotent: an already-hashed org is skipped.
 *   - Prints org ids and counts only, never a key or a hash.
 *   - Local only, with Application Default Credentials (`gcloud auth application-default login`),
 *     against stea-775cd. No public API.
 *
 * USAGE (from the repo root)
 *   node scripts/orbit/hash-org-keys.mjs           # dry run
 *   node scripts/orbit/hash-org-keys.mjs --apply   # writes
 */

import admin from 'firebase-admin';
import { keyMigrationFor } from '../../src/lib/orbit/orgKeys.js';
import { COLLECTION_NAMES } from '../../src/lib/orbit/collections.js';

const PROJECT_ID = 'stea-775cd';
const APPLY = process.argv.slice(2).includes('--apply');

admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();

async function main() {
  console.log(`Orbit key migration — project ${PROJECT_ID} — ${APPLY ? 'APPLY (writing)' : 'DRY RUN (no writes)'}`);
  const snap = await db.collection(COLLECTION_NAMES.ORGS).get();
  const plan = [];
  for (const doc of snap.docs) {
    const migration = keyMigrationFor({ id: doc.id, ...doc.data() });
    if (migration) plan.push({ ref: doc.ref, orgId: doc.data().orgId, migration });
  }
  console.log(`orgs: ${snap.size} | to migrate: ${plan.length} | already hashed or keyless: ${snap.size - plan.length}`);
  for (const p of plan) console.log(`  ${p.orgId}`);
  if (!APPLY || plan.length === 0) return;

  const batch = db.batch();
  for (const p of plan) {
    batch.update(p.ref, {
      ...p.migration.set,
      apiKey: admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();

  const after = await db.collection(COLLECTION_NAMES.ORGS).get();
  const left = after.docs.filter((d) => typeof d.data().apiKey === 'string').length;
  console.log(`done: ${plan.length} migrated | plaintext keys left: ${left}`);
  if (left !== 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
