# STEa Multi-Tenant Migration Guide

This guide will help you migrate your existing STEa data to the new multi-tenant architecture.

## Overview

The multi-tenant system adds:
- **tenants** collection: Workspaces/instances
- **tenant_members** collection: User access control
- **tenantId** field: Added to all STEa entities (cards, epics, features, test data, etc.)

## Migration Steps

### 1. Deploy Code (Before Firestore Rules)

⚠️ **IMPORTANT**: Deploy the new code BEFORE updating Firestore rules!

```bash
# Commit and push all changes
git add .
git commit -m "Add multi-tenant infrastructure for STEa"
git push -u origin claude/stea-multi-tenant-admin-011CUpMEn4yuSov5rm5q2brH
```

Deploy to your hosting (Vercel/Firebase/etc.) but **DO NOT deploy the new Firestore rules yet**.

### 2. Create Default Tenant

Use the admin interface at `/apps/stea/admin` to create your first tenant:

1. Sign in with `repinfaust@gmail.com`
2. Navigate to `/apps/stea/admin`
3. Click "+ New Workspace"
4. Name: "Arcturus Internal" (or your preferred name)
5. Plan: "team"
6. Create

**Copy the tenant ID** (you'll see it in the URL or browser console)

### 3. Add Your Partner

In the admin interface:
1. Click "Manage" on your new workspace
2. Go to "Members" tab
3. Click "+ Add Member"
4. Email: `daryn.shaxted@gmail.com`
5. Role: admin
6. Add Member

### 4. Run Migration Script

Create a migration script using Firebase Admin SDK. You can run this from a Node.js script or Cloud Function:

```javascript
// migration-script.js
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const DEFAULT_TENANT_ID = 'YOUR_TENANT_ID_FROM_STEP_2';

async function migrateCollection(collectionName) {
  console.log(`Migrating ${collectionName}...`);

  const snapshot = await db.collection(collectionName).get();
  let count = 0;
  let batch = db.batch();

  for (const doc of snapshot.docs) {
    // Skip if already has tenantId
    if (doc.data().tenantId) {
      console.log(`  ${doc.id} already has tenantId, skipping`);
      continue;
    }

    // Add tenantId to document
    batch.update(doc.ref, {
      tenantId: DEFAULT_TENANT_ID
    });

    count++;

    // Commit batch every 500 docs (Firestore limit)
    if (count % 500 === 0) {
      await batch.commit();
      console.log(`  Committed ${count} documents`);
      batch = db.batch();
    }
  }

  // Commit remaining
  if (count % 500 !== 0) {
    await batch.commit();
  }

  console.log(`✓ Migrated ${count} documents in ${collectionName}`);
}

async function runMigration() {
  console.log('Starting migration to multi-tenant architecture...\n');
  console.log(`Default Tenant ID: ${DEFAULT_TENANT_ID}\n`);

  const collections = [
    'stea_cards',
    'stea_epics',
    'stea_features',
    'automated_test_runs',
    'automated_test_issues',
    'toume_test_results',
    'toume_test_sessions',
    'hans_cases',
  ];

  for (const collectionName of collections) {
    try {
      await migrateCollection(collectionName);
    } catch (error) {
      console.error(`Error migrating ${collectionName}:`, error);
    }
  }

  console.log('\n✓ Migration complete!');
}

runMigration().catch(console.error);
```

**To run:**
```bash
node migration-script.js
```

### 5. Deploy New Firestore Rules

Once migration is complete, deploy the updated Firestore rules:

```bash
firebase deploy --only firestore:rules
```

### 6. Verify

1. Sign in to `/apps/stea`
2. You should see the tenant switcher in the navigation
3. All your existing data should be visible
4. Try creating a new card/epic - it should include tenantId automatically

## Testing Multi-Tenancy

To test that isolation works:

1. Create a second test tenant in admin
2. Add a test user email to the second tenant
3. Sign in as that user
4. Verify they can ONLY see data for their tenant
5. Verify they CANNOT see your Arcturus Internal data

## Rollback Plan

If something goes wrong:

1. Revert Firestore rules to previous version:
```bash
git checkout HEAD~1 firestore.rules
firebase deploy --only firestore:rules
```

2. The tenantId fields won't break anything - existing code will just ignore them

3. You can remove tenantId fields manually via Firebase Console if needed

## Adding New Customers

Once migrated:

1. Go to `/apps/stea/admin`
2. Create new workspace for customer
3. Add their team members' emails
4. They can now sign in with Google and only see their workspace

## Future: Updating Apps

The apps (Filo, Hans, Harls) need updates to use `tenantId` in queries.

**Quick fix for existing pages:**
All queries need to filter by `currentTenant.id`:

```javascript
// OLD
const q = query(collection(db, 'stea_cards'), orderBy('createdAt', 'asc'));

// NEW
import { useTenant } from '@/contexts/TenantContext';
const { currentTenant } = useTenant();

const q = query(
  collection(db, 'stea_cards'),
  where('tenantId', '==', currentTenant?.id),
  orderBy('createdAt', 'asc')
);
```

All creates need to include `tenantId`:

```javascript
// OLD
await addDoc(collection(db, 'stea_cards'), { title, ... });

// NEW
await addDoc(collection(db, 'stea_cards'), {
  title,
  tenantId: currentTenant.id,
  ...
});
```

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify tenant_members collection has your email
3. Check Firestore rules are deployed
4. Verify all docs have tenantId field after migration

---

**Remember**: Deploy code → Create tenant → Migrate data → Deploy rules
