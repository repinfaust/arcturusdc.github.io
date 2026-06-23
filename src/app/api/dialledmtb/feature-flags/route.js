import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { getDialledMTBDb } from '@/lib/firebase-admin-dialledmtb';

const SUPER_ADMINS = ['repinfaust@gmail.com', 'daryn.shaxted@gmail.com', 'dialled.app@gmail.com'];
const VALID_FLAGS = ['labsEnabled', 'nfcBikeSwitchEnabled', 'coach_mode_v1'];

async function verifyAdmin(idToken) {
  const { auth } = getFirebaseAdmin();
  const decoded = await auth.verifyIdToken(idToken);
  if (!SUPER_ADMINS.includes(decoded.email)) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }
  return decoded;
}

// GET /api/dialledmtb/feature-flags?uid={uid}
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    const idToken = request.headers.get('x-id-token');

    if (!uid || !idToken) {
      return NextResponse.json({ error: 'Missing uid or auth token' }, { status: 400 });
    }

    await verifyAdmin(idToken);

    const db = getDialledMTBDb();
    const snap = await db.collection('userFeatureFlags').doc(uid).get();

    if (!snap.exists) {
      return NextResponse.json({ flags: null });
    }

    const data = snap.data();
    return NextResponse.json({
      flags: {
        labsEnabled: data.labsEnabled ?? false,
        nfcBikeSwitchEnabled: data.nfcBikeSwitchEnabled ?? false,
        coach_mode_v1: data.coach_mode_v1 ?? false,
        featureNotes: data.featureNotes ?? '',
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? null,
        updatedBy: data.updatedBy ?? null,
        source: data.source ?? null,
      },
    });
  } catch (err) {
    if (err.status === 403) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (err.code === 'auth/argument-error' || err.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[dialledmtb/feature-flags GET]', err.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/dialledmtb/feature-flags
// Body: { uid, flag, value, featureNotes?, idToken }
export async function POST(request) {
  try {
    const body = await request.json();
    const { uid, flag, value, featureNotes, idToken } = body;

    if (!uid || !flag || typeof value !== 'boolean' || !idToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!VALID_FLAGS.includes(flag)) {
      return NextResponse.json({ error: 'Invalid flag name' }, { status: 400 });
    }

    const decoded = await verifyAdmin(idToken);
    const db = getDialledMTBDb();
    const ref = db.collection('userFeatureFlags').doc(uid);

    const update = {
      uid,
      [flag]: value,
      updatedAt: new Date(),
      updatedBy: decoded.email,
      source: 'stea_admin',
    };

    if (typeof featureNotes === 'string') {
      update.featureNotes = featureNotes;
    }

    await ref.set(update, { merge: true });

    const snap = await ref.get();
    const data = snap.data();

    return NextResponse.json({
      ok: true,
      flags: {
        labsEnabled: data.labsEnabled ?? false,
        nfcBikeSwitchEnabled: data.nfcBikeSwitchEnabled ?? false,
        coach_mode_v1: data.coach_mode_v1 ?? false,
        featureNotes: data.featureNotes ?? '',
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? null,
        updatedBy: data.updatedBy ?? null,
        source: data.source ?? null,
      },
    });
  } catch (err) {
    if (err.status === 403) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (err.code === 'auth/argument-error' || err.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[dialledmtb/feature-flags POST]', err.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
