import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import crypto from 'crypto';

const SESSION_COOKIE_NAME = '__session';
const CSRF_COOKIE_NAME = '__csrf';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

// Generate a cryptographically secure CSRF token
const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

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
      sameSite: 'strict',
      path: '/',
    });

    // Set CSRF token in a separate cookie
    const csrfToken = generateCSRFToken();
    response.cookies.set({
      name: CSRF_COOKIE_NAME,
      value: csrfToken,
      maxAge: SESSION_MAX_AGE_SECONDS,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return response;
  } catch (error) {
    // Log detailed error server-side only
    console.error('[Login Error]', {
      code: error?.code,
      message: error?.message,
      timestamp: new Date().toISOString(),
    });

    // Return generic error to client (don't expose internal details)
    return NextResponse.json(
      { error: 'Authentication failed. Please try again.' },
      { status: 401 }
    );
  }
}
