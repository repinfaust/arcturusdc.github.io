import { NextResponse } from 'next/server';
import { requireTenantAccess } from '@/lib/companion/companionAuth';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import {
  COMPANION_ITEM_COLLECTIONS,
  JOTS_COLLECTION,
  NOW_BAND,
  NOW_WIP_LIMIT,
} from '@/lib/companion/companionModel';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const ALLOWED_COLLECTIONS = new Set(Object.values(COMPANION_ITEM_COLLECTIONS));

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseItemId(value) {
  const itemId = clean(value);
  const [collection, docId] = itemId.split('/');
  if (!collection || !docId || !ALLOWED_COLLECTIONS.has(collection)) return null;
  return { collection, docId };
}

function parseTarget(body) {
  const collection = clean(body?.collection);
  const docId = clean(body?.docId || body?.id || body?.itemId);
  if (collection && docId && ALLOWED_COLLECTIONS.has(collection)) {
    return { collection, docId };
  }
  return parseItemId(body?.itemId);
}

async function moveNestedToDone(db, FieldValue, collection, docId, basePayload) {
  if (collection === 'stea_epics') {
    const [features, cards] = await Promise.all([
      db.collection('stea_features').where('epicId', '==', docId).get(),
      db.collection('stea_cards').where('epicId', '==', docId).get(),
    ]);
    await Promise.all([
      ...features.docs.map((doc) => doc.ref.update(basePayload)),
      ...cards.docs.map((doc) => doc.ref.update(basePayload)),
    ]);
  }

  if (collection === 'stea_features') {
    const cards = await db.collection('stea_cards').where('featureId', '==', docId).get();
    await Promise.all(cards.docs.map((doc) => doc.ref.update(basePayload)));
  }
}

async function countNowItems(db, tenantId) {
  const counts = await Promise.all(
    Object.values(COMPANION_ITEM_COLLECTIONS).map(async (collection) => {
      const snap = await db.collection(collection).where('priorityBand', '==', NOW_BAND).get();
      return snap.docs.filter((doc) => clean(doc.data()?.tenantId) === tenantId).length;
    })
  );
  return counts.reduce((total, count) => total + count, 0);
}

async function updateTarget(db, FieldValue, target, authUser, action) {
  const ref = db.collection(target.collection).doc(target.docId);
  const now = FieldValue.serverTimestamp();

  if (action === 'done') {
    const payload = {
      priorityBand: 'done',
      activityState: 'done',
      updatedAt: now,
      completedAt: now,
      completedBy: authUser.email,
    };
    if (target.collection !== JOTS_COLLECTION) {
      payload.statusColumn = 'Done';
    }
    await ref.update(payload);
    await moveNestedToDone(db, FieldValue, target.collection, target.docId, payload);
    return 'done';
  }

  const payload = {
    priorityBand: NOW_BAND,
    companionOrder: Date.now(),
    updatedAt: now,
    movedToNowAt: now,
    movedToNowBy: authUser.email,
  };
  await ref.update(payload);
  return NOW_BAND;
}

export async function PATCH(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const target = parseTarget(body);
  const action = clean(body?.action);
  const requestedTenantId = clean(body?.tenantId);

  if (!target) {
    return NextResponse.json({ error: 'Valid itemId is required.' }, { status: 400 });
  }
  if (action !== 'done' && action !== 'now') {
    return NextResponse.json({ error: 'Unsupported companion item action.' }, { status: 400 });
  }

  try {
    const { db, FieldValue } = getFirebaseAdmin();
    if (requestedTenantId) {
      const auth = await requireTenantAccess(request, requestedTenantId);
      if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
      }

      const ref = db.collection(target.collection).doc(target.docId);
      const snap = await ref.get();
      if (!snap.exists) {
        return NextResponse.json({ error: 'Item not found.' }, { status: 404 });
      }

      const data = snap.data() || {};
      if (clean(data.tenantId) !== requestedTenantId) {
        return NextResponse.json({ error: 'Workspace access required.' }, { status: 403 });
      }
      if (action === 'now' && data.priorityBand !== NOW_BAND) {
        const nowCount = await countNowItems(db, requestedTenantId);
        if (nowCount >= NOW_WIP_LIMIT) {
          return NextResponse.json(
            { error: 'NOW is full. Move something out of NOW before adding another item.' },
            { status: 409 }
          );
        }
      }

      const priorityBand = await updateTarget(db, FieldValue, target, auth.user, action);

      return NextResponse.json({
        item: {
          id: target.docId,
          collection: target.collection,
          priorityBand,
        },
      });
    }

    const ref = db.collection(target.collection).doc(target.docId);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Item not found.' }, { status: 404 });
    }

    const data = snap.data() || {};
    const tenantId = clean(data.tenantId);
    const auth = await requireTenantAccess(request, tenantId);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (action === 'now' && data.priorityBand !== NOW_BAND) {
      const nowCount = await countNowItems(db, tenantId);
      if (nowCount >= NOW_WIP_LIMIT) {
        return NextResponse.json(
          { error: 'NOW is full. Move something out of NOW before adding another item.' },
          { status: 409 }
        );
      }
    }

    const priorityBand = await updateTarget(db, FieldValue, target, auth.user, action);

    return NextResponse.json({
      item: {
        id: target.docId,
        collection: target.collection,
        priorityBand,
      },
    });
  } catch (error) {
    console.error('[companion/items]', error?.message);
    return NextResponse.json({ error: 'Failed to update item.' }, { status: 500 });
  }
}
