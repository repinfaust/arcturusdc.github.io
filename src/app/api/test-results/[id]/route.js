// src/app/api/test-results/[id]/route.js
import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';

const SESSION_COOKIE_NAME = '__session';

export async function GET(request, { params }) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { auth, db } = getFirebaseAdmin();
    await auth.verifySessionCookie(sessionCookie, true);

    const { id } = params;
    const ref = db.collection('test_results').doc(id);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json({ error: 'Results not found', id }, { status: 404 });
    }

    const data = snap.data();
    return NextResponse.json(
      {
        id,
        ...data,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Failed to load test results', error);
    return NextResponse.json(
      { error: 'Failed to load results', details: error?.message ?? String(error) },
      { status: 500 },
    );
  }
}
