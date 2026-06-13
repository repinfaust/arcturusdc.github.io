import { NextResponse } from 'next/server';
import { verifyCompanionUser, listAccessibleTenants } from '@/lib/companion/companionAuth';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import {
  COMPANION_ITEM_COLLECTIONS,
  JOTS_COLLECTION,
  NOW_WIP_LIMIT,
} from '@/lib/companion/companionModel';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Read companion items in a given priority band across ALL three item
// collections, restricted to the set of tenants the user can access. The
// companion is cross-workspace by design (spec §5): NOW/NEXT surface your
// active work regardless of which project it belongs to, each item tagged with
// its workspace. Items without a priorityBand never appear.
async function readBand(db, band, allowedTenantIds, tenantNames) {
  const allowed = new Set(allowedTenantIds);
  const collections = Object.entries(COMPANION_ITEM_COLLECTIONS);

  const results = await Promise.all(
    collections.map(async ([itemType, collection]) => {
      // Query by band only (single-field index, auto-created), then filter to
      // the user's accessible tenants in code — avoids a query per tenant.
      const snap = await db.collection(collection).where('priorityBand', '==', band).get();
      return snap.docs
        .filter((d) => allowed.has(d.data().tenantId))
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            itemType,
            collection,
            title: data.title || data.name || data.rawText || 'Untitled',
            app: data.app || null,
            tenantId: data.tenantId,
            workspace: tenantNames.get(data.tenantId) || null,
            activityState: data.activityState || null,
            priorityBand: band,
            companionOrder: typeof data.companionOrder === 'number' ? data.companionOrder : null,
          };
        });
    })
  );

  const items = results.flat();
  if (band === 'next') {
    const unbandedJots = await db.collection(JOTS_COLLECTION).where('status', '==', 'captured').get();
    unbandedJots.docs
      .filter((d) => {
        const data = d.data();
        return allowed.has(data.tenantId) && !data.priorityBand;
      })
      .forEach((d) => {
        const data = d.data();
        items.push({
          id: d.id,
          itemType: 'jot',
          collection: JOTS_COLLECTION,
          title: data.rawText || 'Untitled',
          app: data.app || null,
          tenantId: data.tenantId,
          workspace: tenantNames.get(data.tenantId) || null,
          activityState: data.activityState || null,
          priorityBand: band,
          companionOrder: typeof data.companionOrder === 'number' ? data.companionOrder : null,
        });
      });
  }
  items.sort((a, b) => {
    const ao = a.companionOrder ?? Number.MAX_SAFE_INTEGER;
    const bo = b.companionOrder ?? Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;
    return a.title.localeCompare(b.title);
  });
  return items;
}

/**
 * GET /api/companion/focus
 * Cross-workspace Focus feed. Returns NOW (WIP-capped) and NEXT items pulled
 * from every workspace the user can access, each tagged with its workspace.
 * Optional ?tenantId=... narrows to a single workspace (filter, not boundary).
 * Auth: Bearer ID token; tenant access enforced by the accessible-tenant set.
 * (AC2, AC4, AC14)
 */
export async function GET(request) {
  const auth = await verifyCompanionUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const filterTenantId = searchParams.get('tenantId'); // optional narrowing

  try {
    const { db } = getFirebaseAdmin();

    // Resolve the user's accessible workspaces (super-admins get all).
    const tenants = await listAccessibleTenants(auth.user);
    const tenantNames = new Map(tenants.map((t) => [t.id, t.name || 'Untitled workspace']));
    let allowedIds = tenants.map((t) => t.id);

    // If a specific workspace is requested, it must be one the user can access.
    if (filterTenantId) {
      if (!allowedIds.includes(filterTenantId)) {
        return NextResponse.json({ error: 'Workspace access required.' }, { status: 403 });
      }
      allowedIds = [filterTenantId];
    }

    if (allowedIds.length === 0) {
      return NextResponse.json({ now: [], next: [], nowOverLimit: false, wipLimit: NOW_WIP_LIMIT });
    }

    const [now, next] = await Promise.all([
      readBand(db, 'now', allowedIds, tenantNames),
      readBand(db, 'next', allowedIds, tenantNames),
    ]);

    return NextResponse.json({
      scope: filterTenantId || 'all',
      now: now.slice(0, NOW_WIP_LIMIT),
      nowOverLimit: now.length > NOW_WIP_LIMIT,
      next,
      wipLimit: NOW_WIP_LIMIT,
    });
  } catch (error) {
    console.error('[companion/focus]', error?.message);
    return NextResponse.json({ error: 'Failed to load focus.' }, { status: 500 });
  }
}
