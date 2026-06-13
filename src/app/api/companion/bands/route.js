import { NextResponse } from 'next/server';
import { verifyCompanionUser, listAccessibleTenants } from '@/lib/companion/companionAuth';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { COMPANION_ITEM_COLLECTIONS, PRIORITY_BANDS } from '@/lib/companion/companionModel';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Cross-workspace items grouped by priority band. Powers the Coming Up
// (this_week / waiting / blocked) and Parking Lot (parked / backlog) views.
// GET /api/companion/bands?bands=this_week,waiting,blocked[&tenantId=...]
// Returns { groups: { this_week: [...], waiting: [...], ... } }.
export async function GET(request) {
  const auth = await verifyCompanionUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const requested = (searchParams.get('bands') || '')
    .split(',')
    .map((b) => b.trim())
    .filter((b) => PRIORITY_BANDS.includes(b));
  const filterTenantId = searchParams.get('tenantId');

  if (requested.length === 0) {
    return NextResponse.json({ error: 'No valid bands requested.' }, { status: 400 });
  }

  try {
    const { db } = getFirebaseAdmin();
    const tenants = await listAccessibleTenants(auth.user);
    const tenantNames = new Map(tenants.map((t) => [t.id, t.name || 'Untitled workspace']));
    let allowedIds = tenants.map((t) => t.id);

    if (filterTenantId) {
      if (!allowedIds.includes(filterTenantId)) {
        return NextResponse.json({ error: 'Workspace access required.' }, { status: 403 });
      }
      allowedIds = [filterTenantId];
    }

    const allowed = new Set(allowedIds);
    const groups = Object.fromEntries(requested.map((b) => [b, []]));

    if (allowedIds.length > 0) {
      const collections = Object.entries(COMPANION_ITEM_COLLECTIONS);
      // One query per (band × collection); filter tenant in code.
      await Promise.all(
        requested.flatMap((band) =>
          collections.map(async ([itemType, collection]) => {
            const snap = await db.collection(collection).where('priorityBand', '==', band).get();
            snap.docs
              .filter((d) => allowed.has(d.data().tenantId))
              .forEach((d) => {
                const data = d.data();
                groups[band].push({
                  id: d.id,
                  itemType,
                  collection,
                  title: data.title || data.name || data.rawText || 'Untitled',
                  app: data.app || null,
                  tenantId: data.tenantId,
                  workspace: tenantNames.get(data.tenantId) || null,
                  activityState: data.activityState || null,
                  priorityBand: band,
                  companionOrder:
                    typeof data.companionOrder === 'number' ? data.companionOrder : null,
                });
              });
          })
        )
      );

      // Stable sort within each band.
      for (const band of requested) {
        groups[band].sort((a, b) => {
          const ao = a.companionOrder ?? Number.MAX_SAFE_INTEGER;
          const bo = b.companionOrder ?? Number.MAX_SAFE_INTEGER;
          if (ao !== bo) return ao - bo;
          return a.title.localeCompare(b.title);
        });
      }
    }

    return NextResponse.json({ scope: filterTenantId || 'all', groups });
  } catch (error) {
    console.error('[companion/bands]', error?.message);
    return NextResponse.json({ error: 'Failed to load items.' }, { status: 500 });
  }
}
