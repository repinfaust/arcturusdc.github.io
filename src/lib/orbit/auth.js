/**
 * Orbit API Authentication Helper
 * Verifies Firebase session cookie for API routes
 */

import { getFirebaseAdmin } from '@/lib/firebaseAdmin';

const SESSION_COOKIE_NAME = '__session';

/**
 * Verify session cookie and return user claims
 * @param {Request} request - Next.js request object
 * @returns {Promise<{authenticated: boolean, user?: object, error?: string}>}
 */
export async function verifySession(request) {
  try {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return {
        authenticated: false,
        error: 'No session cookie found. Please sign in.',
      };
    }

    const { auth } = getFirebaseAdmin();
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

    return {
      authenticated: true,
      user: {
        uid: decodedClaims.uid,
        email: decodedClaims.email,
      },
    };
  } catch (error) {
    console.error('Session verification error:', error);
    return {
      authenticated: false,
      error: error.code === 'auth/session-cookie-expired' 
        ? 'Session expired. Please sign in again.'
        : 'Invalid session. Please sign in.',
    };
  }
}

