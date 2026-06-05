import { NextResponse } from 'next/server';
import { requireTenantAccess } from '@/lib/companion/companionAuth';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { COMPANION_ITEM_COLLECTIONS, NOW_WIP_LIMIT } from '@/lib/companion/companionModel';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Read companion items for a tenant in a given priority band, across all three
// item collections. Items without a priorityBand (untriaged legacy items) are
// simply absent — they don't appear in Focus, which is correct.
async function readBand(db, tenantId, band) {
  const collections = Object.entries(COMPANION_ITEM_COLLECTIONS); // [['epic','stea_epics'], ...]
  const results = await Promise.all(
    collections.map(async ([itemType, collection]) => {
      const snap = await db
        .collection(collection)
        .where('tenantId', '==', tenantId)
        .where('priorityBand', '==', band)
        .get();
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          itemType,
          collection,
          title: data.title || data.name || 'Untitled',
          app: data.app || null,
          activityState: data.activityState || null,
          priorityBand: band,
          companionOrder: typeof data.companionOrder === 'number' ? data.companionOrder : null,
        };
      });
    })
  );
  const items = results.flat();
  // Stable order: companionOrder asc, nulls last, then title.
  items.sort((a, b) => {
    const ao = a.companionOrder ?? Number.MAX_SAFE_INTEGER;
    const bo = b.companionOrder ?? Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;
    return a.title.localeCompare(b.title);
  });
  return items;
}

/**
 * GET /api/companion/focus?tenantId=...
 * Returns NOW (capped at WIP limit) and NEXT items for the Focus view.
 * Auth: Bearer ID token + active tenant membership. (AC2, AC4, AC14)
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId');

  const access = await requireTenantAccess(request, tenantId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const { db } = getFirebaseAdmin();
    const [now, next] = await Promise.all([
      readBand(db, tenantId, 'now'),
      readBand(db, tenantId, 'next'),
    ]);

    return NextResponse.json({
      tenantId,
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
