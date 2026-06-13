import { NextResponse } from 'next/server';
import { requireTenantAccess } from '@/lib/companion/companionAuth';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import {
  COMPANION_ITEM_COLLECTIONS,
  JOTS_COLLECTION,
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
  if (action !== 'done') {
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

      const donePayload = {
        priorityBand: 'done',
        activityState: 'done',
        updatedAt: FieldValue.serverTimestamp(),
        completedAt: FieldValue.serverTimestamp(),
        completedBy: auth.user.email,
      };
      if (target.collection !== JOTS_COLLECTION) {
        donePayload.statusColumn = 'Done';
      }

      await ref.update(donePayload);
      await moveNestedToDone(db, FieldValue, target.collection, target.docId, donePayload);

      return NextResponse.json({
        item: {
          id: target.docId,
          collection: target.collection,
          priorityBand: 'done',
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

    const donePayload = {
      priorityBand: 'done',
      activityState: 'done',
      updatedAt: FieldValue.serverTimestamp(),
      completedAt: FieldValue.serverTimestamp(),
      completedBy: auth.user.email,
    };
    if (target.collection !== JOTS_COLLECTION) {
      donePayload.statusColumn = 'Done';
    }

    await ref.update(donePayload);
    await moveNestedToDone(db, FieldValue, target.collection, target.docId, donePayload);

    return NextResponse.json({
      item: {
        id: target.docId,
        collection: target.collection,
        priorityBand: 'done',
      },
    });
  } catch (error) {
    console.error('[companion/items]', error?.message);
    return NextResponse.json({ error: 'Failed to update item.' }, { status: 500 });
  }
}
