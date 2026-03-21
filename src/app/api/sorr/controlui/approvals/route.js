import { NextResponse } from 'next/server';
import { COLLECTIONS, ensureSeedData, getSorrDb, verifySorrSession } from '@/lib/sorr/controlui-server';

function makeAuditId() {
  return `AUD-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
}

export async function POST(request) {
  const auth = await verifySorrSession(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const requestId = String(body?.requestId || '').trim();
    const action = String(body?.action || '').trim().toUpperCase();
    const note = String(body?.note || '').trim();

    if (!requestId) return NextResponse.json({ error: 'requestId is required.' }, { status: 400 });
    if (action !== 'APPROVE' && action !== 'REJECT') {
      return NextResponse.json({ error: 'action must be APPROVE or REJECT.' }, { status: 400 });
    }
    if (action === 'REJECT' && !note) {
      return NextResponse.json({ error: 'A rejection note is required.' }, { status: 400 });
    }

    const { db } = await getSorrDb();
    await ensureSeedData(db);

    const ref = db.collection(COLLECTIONS.requests).doc(requestId);
    const existing = await ref.get();
    if (!existing.exists) {
      return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
    }

    const existingData = existing.data() || {};
    const now = new Date();
    const nextStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    await ref.set(
      {
        status: nextStatus,
        approvalNote: note || null,
        approvedBy: auth.user.email,
        updatedAt: now,
      },
      { merge: true }
    );

    const auditEvent = {
      id: makeAuditId(),
      requestId,
      actor: auth.user.email,
      action: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      detail: note || (action === 'APPROVE' ? 'Approved for governed execution.' : 'Rejected by reviewer.'),
      tier: Number(existingData.tier || 4),
      createdAt: now,
    };
    await db.collection(COLLECTIONS.auditLog).doc(auditEvent.id).set(auditEvent);

    return NextResponse.json(
      {
        status: 'ok',
        requestId,
        requestStatus: nextStatus,
        updatedAt: now.toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SoRR Control approvals] failed', error);
    return NextResponse.json({ error: 'Failed to process approval action.' }, { status: 500 });
  }
}
