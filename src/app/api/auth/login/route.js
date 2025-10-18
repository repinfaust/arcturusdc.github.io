import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';

const SESSION_COOKIE_NAME = '__session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function POST(request) {
  try {
    const { idToken } = await request.json();

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    const { auth } = getFirebaseAdmin();
    const expiresInMs = SESSION_MAX_AGE_SECONDS * 1000;
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn: expiresInMs });
    const decodedToken = await auth.verifyIdToken(idToken);

    const response = NextResponse.json(
      {
        status: 'ok',
        email: decodedToken.email ?? null,
        uid: decodedToken.uid,
      },
      { status: 200 }
    );

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionCookie,
      maxAge: SESSION_MAX_AGE_SECONDS,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Failed to create session cookie', error);
    return NextResponse.json(
      { error: 'Failed to create session cookie', details: error?.message ?? String(error) },
      { status: 401 }
    );
  }
}
