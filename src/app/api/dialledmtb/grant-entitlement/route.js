import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';

const SUPER_ADMINS = ['repinfaust@gmail.com', 'daryn.shaxted@gmail.com'];
const ENTITLEMENT_ID = 'ArcturusDC: DialledMTB Pro';
const VALID_DURATIONS = ['monthly', 'three_month', 'six_month', 'yearly', 'lifetime'];

export async function POST(request) {
  try {
    const body = await request.json();
    const { uid, duration, idToken } = body;

    if (!uid || !duration || !idToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!VALID_DURATIONS.includes(duration)) {
      return NextResponse.json({ error: 'Invalid duration' }, { status: 400 });
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

    const rcSecretKey = process.env.REVENUECAT_SECRET_KEY;
    if (!rcSecretKey) throw new Error('REVENUECAT_SECRET_KEY is not set');

    const encodedUid = encodeURIComponent(uid);
    const encodedEntitlement = encodeURIComponent(ENTITLEMENT_ID);
    const url = `https://api.revenuecat.com/v1/subscribers/${encodedUid}/entitlements/${encodedEntitlement}/promotional`;

    const rcResponse = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rcSecretKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ duration }),
    });

    if (!rcResponse.ok) {
      const rcBody = await rcResponse.text();
      console.error('[grant-entitlement] RC error', rcResponse.status, rcBody);
      return NextResponse.json(
        { error: `RevenueCat returned ${rcResponse.status}` },
        { status: 502 }
      );
    }

    const rcData = await rcResponse.json();
    return NextResponse.json({ ok: true, subscriber: rcData.subscriber });
  } catch (err) {
    console.error('[dialledmtb/grant-entitlement]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
