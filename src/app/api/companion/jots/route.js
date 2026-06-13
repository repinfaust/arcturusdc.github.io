import { NextResponse } from 'next/server';
import { requireTenantAccess } from '@/lib/companion/companionAuth';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import {
  COMPANION_ITEM_COLLECTIONS,
  JOTS_COLLECTION,
  NOW_BAND,
  NOW_WIP_LIMIT,
  isPriorityBand,
} from '@/lib/companion/companionModel';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const MAX_JOT_LENGTH = 4000;

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

async function countNowItems(db, tenantId) {
  const counts = await Promise.all(
    Object.values(COMPANION_ITEM_COLLECTIONS).map(async (collection) => {
      const snap = await db
        .collection(collection)
        .where('priorityBand', '==', NOW_BAND)
        .get();
      return snap.docs.filter((d) => d.data()?.tenantId === tenantId).length;
    })
  );
  return counts.reduce((sum, count) => sum + count, 0);
}

/**
 * POST /api/companion/jots
 * Creates a raw STEa Companion capture in the tenant-scoped stea_jots
 * collection. Auth: Bearer ID token; tenant access enforced server-side.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const tenantId = typeof body?.tenantId === 'string' ? body.tenantId.trim() : '';
  const rawText = cleanText(body?.rawText);
  const priorityBand =
    typeof body?.priorityBand === 'string' && body.priorityBand.trim()
      ? body.priorityBand.trim()
      : null;

  if (!tenantId) {
    return NextResponse.json({ error: 'Workspace is required.' }, { status: 400 });
  }
  if (!rawText) {
    return NextResponse.json({ error: 'Jot text is required.' }, { status: 400 });
  }
  if (rawText.length > MAX_JOT_LENGTH) {
    return NextResponse.json(
      { error: `Jot text must be ${MAX_JOT_LENGTH} characters or fewer.` },
      { status: 400 }
    );
  }
  if (priorityBand && !isPriorityBand(priorityBand)) {
    return NextResponse.json({ error: 'Invalid priority band.' }, { status: 400 });
  }

  const auth = await requireTenantAccess(request, tenantId);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { db, FieldValue } = getFirebaseAdmin();
    if (priorityBand === NOW_BAND) {
      const nowCount = await countNowItems(db, tenantId);
      if (nowCount >= NOW_WIP_LIMIT) {
        return NextResponse.json(
          { error: `NOW is full. Move something out of NOW before adding another item.` },
          { status: 409 }
        );
      }
    }

    const now = FieldValue.serverTimestamp();
    const payload = {
      tenantId,
      rawText,
      status: 'captured',
      source: 'stea-companion',
      createdAt: now,
      updatedAt: now,
      createdBy: auth.user.uid,
      createdByEmail: auth.user.email,
    };
    if (priorityBand) {
      payload.priorityBand = priorityBand;
      payload.companionOrder = Date.now();
    }

    const ref = await db.collection(JOTS_COLLECTION).add(payload);
    return NextResponse.json(
      {
        jot: {
          id: ref.id,
          tenantId,
          rawText,
          status: payload.status,
          priorityBand,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[companion/jots]', error?.message);
    return NextResponse.json({ error: 'Failed to save jot.' }, { status: 500 });
  }
}
