import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { getDialledMTBDb } from '@/lib/firebase-admin-dialledmtb';

const SUPER_ADMINS = ['repinfaust@gmail.com', 'daryn.shaxted@gmail.com'];

export async function POST(request) {
  try {
    const body = await request.json();
    const email = body.email?.toLowerCase().trim();
    const idToken = body.idToken;

    if (!email || !idToken) {
      return NextResponse.json({ error: 'Missing email or auth token' }, { status: 400 });
    }

    const { auth } = getFirebaseAdmin();
    let decoded;
    try {
      decoded = await auth.verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!SUPER_ADMINS.includes(decoded.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = getDialledMTBDb();
    const snap = await db.collection('users').where('email', '==', email).limit(1).get();

    if (snap.empty) {
      return NextResponse.json({ user: null });
    }

    const doc = snap.docs[0];
    const data = doc.data();

    const bikesSnap = await db.collection('bikes').where('userId', '==', data.uid).get();

    return NextResponse.json({
      user: {
        uid: data.uid,
        email: data.email,
        displayName: data.displayName ?? null,
        authProvider: data.authProvider ?? null,
        stravaConnected: data.stravaConnected ?? false,
        totalRideCount: data.totalRideCount ?? 0,
        bikeCount: bikesSnap.size,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
      },
    });
  } catch (err) {
    console.error('[dialledmtb/riders]', err.message, err.stack);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
