# Integrating Tenant Context into Filo

This guide shows how to update `/apps/stea/filo/page.js` to work with multi-tenancy.

## Key Changes Required

### 1. Import Tenant Hook

Add to imports at the top:
```javascript
import { useTenant } from '@/contexts/TenantContext';
import TenantSwitcher from '@/components/TenantSwitcher';
```

### 2. Use Tenant Hook in Component

Add inside the main component function (around line 420):
```javascript
export default function FiloBoard() {
  const { currentTenant, loading: tenantLoading } = useTenant();

  // ... existing state declarations
```

### 3. Update Data Loading Effect

Find the useEffect that loads data (around line 420-460). Modify it to:

```javascript
useEffect(() => {
  if (!user || !currentTenant?.id || tenantLoading) {
    return;
  }

  // Cards query with tenant filter
  const qy = query(
    collection(db, 'stea_cards'),
    where('tenantId', '==', currentTenant.id),
    orderBy('createdAt', 'asc')
  );

  const epicsRef = collection(db, 'stea_epics');
  const epicsQ = query(epicsRef, where('tenantId', '==', currentTenant.id));

  const featuresRef = collection(db, 'stea_features');
  const featuresQ = query(featuresRef, where('tenantId', '==', currentTenant.id));

  // ... rest of snapshot logic
}, [user, currentTenant, tenantLoading]);
```

### 4. Update Create Functions

Find the `addEntity` function (around line 940-980). Add tenantId to payload:

```javascript
async function addEntity(type, { title, epicId, featureId, priority, app, size }) {
  if (!currentTenant?.id) {
    alert('Please select a workspace first');
    return;
  }

  const collectionName = COLLECTION_MAP[type];
  const payload = {
    title: title || '',
    priority: priority || 'medium',
    app: app || '',
    size: size || '?',
    status: COLUMNS[0],
    createdAt: serverTimestamp(),
    tenantId: currentTenant.id, // ← ADD THIS
  };

  // Add epic/feature links as before
  if (type === 'feature' && epicId) payload.epicId = epicId;
  if (type === 'card' && featureId) payload.featureId = featureId;

  try {
    await addDoc(collection(db, collectionName), payload);
    // ... rest of function
  }
}
```

### 5. Update the UI Header

Find the header section (around line 1100-1150) and add TenantSwitcher:

```javascript
<div className="flex items-center justify-between border-b ... px-6 py-4">
  <div className="flex items-center gap-4">
    <Link href="/apps/stea" ...>
      ← Back to STEa
    </Link>
    <div className="h-6 w-px bg-neutral-200" />
    <h1>Filo Board</h1>
  </div>

  {/* ADD TENANT SWITCHER HERE */}
  <div className="flex items-center gap-4">
    <TenantSwitcher />
    <button onClick={handleSignOut} ...>
      Sign out
    </button>
  </div>
</div>
```

### 6. Add Loading State

Before the main board rendering, add a tenant check:

```javascript
// After auth check, add:
if (user && tenantLoading) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-neutral-600">Loading workspace...</div>
    </div>
  );
}

if (user && !currentTenant) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="max-w-md rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
        <h2 className="mb-2 text-lg font-semibold text-amber-900">
          No Workspace Access
        </h2>
        <p className="mb-4 text-sm text-amber-700">
          You don't have access to any workspaces yet. Contact your administrator.
        </p>
        <Link
          href="/apps/stea"
          className="inline-block rounded-lg bg-amber-600 px-4 py-2 text-sm text-white hover:bg-amber-700"
        >
          Back to STEa
        </Link>
      </div>
    </div>
  );
}
```

## Complete Checklist

- [ ] Import useTenant and TenantSwitcher
- [ ] Add useTenant hook to component
- [ ] Add `where('tenantId', '==', currentTenant.id)` to cards query
- [ ] Add `where('tenantId', '==', currentTenant.id)` to epics query
- [ ] Add `where('tenantId', '==', currentTenant.id)` to features query
- [ ] Add `tenantId: currentTenant.id` to all create operations
- [ ] Add TenantSwitcher to UI header
- [ ] Add loading states for tenant
- [ ] Add "no tenant" error state
- [ ] Update comment queries (if they filter by tenant)
- [ ] Test: Can only see data for selected tenant
- [ ] Test: Switching tenants changes visible data
- [ ] Test: Creating cards includes correct tenantId

## Testing

After changes:
1. Sign in to Filo
2. Verify you see the tenant switcher
3. Verify you only see cards/epics/features for current tenant
4. Create a new card - check in Firestore it has `tenantId`
5. Switch tenant (if you have multiple) - data should change
6. Try signing in as a different user in a different tenant - verify isolation

## Notes

- The same pattern applies to Hans (`/apps/stea/hans/page.js`)
- The same pattern applies to Harls (`/apps/stea/harls/page.js`)
- Any automated test pages also need updating
- The MCP server will need updating to pass tenantId when creating entities

## Helper Functions

You can use the helpers from `/src/lib/steaDbHelpers.js`:

```javascript
import { createTenantQuery, createSteaEntity } from '@/lib/steaDbHelpers';

// Instead of manual query building:
const cardsQuery = createTenantQuery(
  'stea_cards',
  currentTenant.id,
  orderBy('createdAt', 'asc')
);

// Instead of manual addDoc:
await createSteaEntity('stea_cards', currentTenant.id, {
  title: 'My card',
  priority: 'high',
  // ... other fields
});
```
