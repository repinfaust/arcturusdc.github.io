import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';

const SESSION_COOKIE_NAME = '__session';

export async function POST(request) {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const response = NextResponse.json({ status: 'ok' }, { status: 200 });

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  if (!cookie) {
    return response;
  }

  try {
    const { auth } = getFirebaseAdmin();
    const decoded = await auth.verifySessionCookie(cookie);
    await auth.revokeRefreshTokens(decoded.sub);
  } catch (error) {
    console.warn('Failed to revoke session cookie', error);
  }

  return response;
}
