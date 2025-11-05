#!/usr/bin/env node

/**
 * STEa Multi-Tenant Migration Script
 *
 * Adds tenantId to all existing STEa data
 *
 * Usage: node migrate-to-multi-tenant.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
// Load service account credentials
const serviceAccount = require('./stea-775cd-1adc69763f06.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'stea-775cd'
});

const db = admin.firestore();

// Your tenant ID
const DEFAULT_TENANT_ID = 'FqhckqMaorJMAQ6B29mP';

// Collections to migrate
const COLLECTIONS = [
  'stea_cards',
  'stea_epics',
  'stea_features',
  'automated_test_runs',
  'automated_test_issues',
  'toume_test_results',
  'toume_test_sessions',
  'hans_cases',
];

/**
 * Migrate a single collection
 */
async function migrateCollection(collectionName) {
  console.log(`\n📦 Migrating ${collectionName}...`);

  try {
    const snapshot = await db.collection(collectionName).get();

    if (snapshot.empty) {
      console.log(`   ⚠️  Collection is empty, skipping`);
      return { total: 0, migrated: 0, skipped: 0 };
    }

    let migrated = 0;
    let skipped = 0;
    let batch = db.batch();
    let batchCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();

      // Skip if already has tenantId
      if (data.tenantId) {
        skipped++;
        console.log(`   ⏭️  ${doc.id} already has tenantId, skipping`);
        continue;
      }

      // Add tenantId to document
      batch.update(doc.ref, {
        tenantId: DEFAULT_TENANT_ID
      });

      migrated++;
      batchCount++;

      // Commit batch every 500 docs (Firestore limit)
      if (batchCount >= 500) {
        await batch.commit();
        console.log(`   ✅ Committed batch of ${batchCount} documents`);
        batch = db.batch();
        batchCount = 0;
      }
    }

    // Commit remaining documents
    if (batchCount > 0) {
      await batch.commit();
      console.log(`   ✅ Committed final batch of ${batchCount} documents`);
    }

    console.log(`   ✨ Migrated ${migrated} documents (${skipped} already had tenantId)`);

    return {
      total: snapshot.size,
      migrated,
      skipped
    };

  } catch (error) {
    console.error(`   ❌ Error migrating ${collectionName}:`, error.message);
    return {
      total: 0,
      migrated: 0,
      skipped: 0,
      error: error.message
    };
  }
}

/**
 * Run migration for all collections
 */
async function runMigration() {
  console.log('🚀 STEa Multi-Tenant Migration');
  console.log('================================\n');
  console.log(`📍 Tenant ID: ${DEFAULT_TENANT_ID}`);
  console.log(`📍 Project: stea-775cd`);
  console.log(`📍 Collections: ${COLLECTIONS.length}\n`);

  const results = {};
  let totalMigrated = 0;
  let totalSkipped = 0;
  let totalDocs = 0;

  for (const collectionName of COLLECTIONS) {
    const result = await migrateCollection(collectionName);
    results[collectionName] = result;
    totalMigrated += result.migrated;
    totalSkipped += result.skipped;
    totalDocs += result.total;
  }

  // Summary
  console.log('\n\n📊 Migration Summary');
  console.log('================================');
  console.log(`Total documents processed: ${totalDocs}`);
  console.log(`✅ Migrated: ${totalMigrated}`);
  console.log(`⏭️  Skipped (already had tenantId): ${totalSkipped}`);

  console.log('\n📋 Breakdown by collection:');
  for (const [collection, result] of Object.entries(results)) {
    if (result.error) {
      console.log(`   ❌ ${collection}: ERROR - ${result.error}`);
    } else if (result.total === 0) {
      console.log(`   ⚠️  ${collection}: empty`);
    } else {
      console.log(`   ✅ ${collection}: ${result.migrated} migrated, ${result.skipped} skipped (${result.total} total)`);
    }
  }

  console.log('\n✨ Migration complete!\n');
}

// Run the migration
runMigration()
  .then(() => {
    console.log('🎉 All done! You can now safely use the multi-tenant system.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
