#!/usr/bin/env node
/**
 * Pre-deploy audit for the firestore.rules tenant-isolation hardening.
 *
 * The new rules REMOVE the "migration-friendly" escape hatch that let any
 * authenticated user access documents with no `tenantId`. After deploy, any
 * doc lacking a `tenantId` becomes INACCESSIBLE to clients (Admin SDK still
 * reaches it). Run this FIRST. If it reports any tenant-less docs in the
 * client-facing collections, BACKFILL them before deploying the rules.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json \
 *   node scripts/audit-tenantless-docs.js
 *
 * Exit codes: 0 = clean (safe to deploy), 1 = tenant-less docs found (backfill first).
 */
const admin = require('firebase-admin');

admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'stea-775cd' });
const db = admin.firestore();

// Collections whose rules previously had the `!('tenantId' in resource.data)`
// escape hatch and now require tenantId + canAccessTenant unconditionally.
// NOTE: `projects` is intentionally excluded. Its rule is membership-primary
// (inProject = owner/member) with tenant isolation applied ONLY when a tenantId
// is present, so tenant-less personal/legacy projects remain accessible to their
// members by design. The other collections require tenantId unconditionally.
const COLLECTIONS = [
  'stea_epics', 'stea_features', 'stea_cards',
  'stea_doc_spaces', 'stea_docs', 'stea_doc_versions',
  'stea_doc_assets', 'stea_doc_links', 'stea_reviews',
  'automated_test_runs', 'automated_test_issues',
  'toume_test_results', 'toume_test_sessions',
  'hans_cases',
];

(async () => {
  let total = 0;
  const report = [];
  for (const col of COLLECTIONS) {
    const snap = await db.collection(col).get();
    const missing = snap.docs.filter((d) => {
      const t = d.get('tenantId');
      return t === undefined || t === null || t === '';
    });
    if (missing.length) {
      report.push({ collection: col, tenantlessCount: missing.length, total: snap.size,
        sampleIds: missing.slice(0, 5).map((d) => d.id) });
      total += missing.length;
    } else {
      report.push({ collection: col, tenantlessCount: 0, total: snap.size });
    }
  }

  console.table(report.map((r) => ({ collection: r.collection,
    'tenant-less': r.tenantlessCount, total: r.total })));

  if (total === 0) {
    console.log('\n✅ CLEAN — no tenant-less docs in client-facing collections. Safe to deploy the hardened rules.');
    process.exit(0);
  }
  console.log(`\n⛔ ${total} tenant-less doc(s) found. These will become client-inaccessible after deploy.`);
  console.log('Backfill a valid tenantId on them (or delete if stale) BEFORE deploying firestore.rules.');
  report.filter((r) => r.tenantlessCount).forEach((r) =>
    console.log(`  - ${r.collection}: ${r.tenantlessCount} (e.g. ${r.sampleIds.join(', ')})`));
  process.exit(1);
})().catch((e) => { console.error('Audit failed:', e); process.exit(2); });
