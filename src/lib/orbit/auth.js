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
      console.error('[Orbit Auth] No session cookie found');
      return {
        authenticated: false,
        error: 'No session cookie found. Please sign in.',
      };
    }

    try {
      const { auth } = getFirebaseAdmin();
      if (!auth) {
        console.error('[Orbit Auth] Firebase Admin auth not initialized');
        return {
          authenticated: false,
          error: 'Server configuration error. Please contact support.',
        };
      }

      const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

      return {
        authenticated: true,
        user: {
          uid: decodedClaims.uid,
          email: decodedClaims.email,
        },
      };
    } catch (adminError) {
      console.error('[Orbit Auth] Firebase Admin error:', adminError);
      // If Firebase Admin isn't initialized, that's a server config issue
      if (adminError.message?.includes('FIREBASE_SERVICE_ACCOUNT')) {
        return {
          authenticated: false,
          error: 'Server configuration error. Please contact support.',
        };
      }
      throw adminError; // Re-throw session verification errors
    }
  } catch (error) {
    console.error('[Orbit Auth] Session verification error:', error);
    console.error('[Orbit Auth] Error code:', error.code);
    console.error('[Orbit Auth] Error message:', error.message);
    
    return {
      authenticated: false,
      error: error.code === 'auth/session-cookie-expired' 
        ? 'Session expired. Please sign in again.'
        : error.code === 'auth/argument-error'
        ? 'Invalid session cookie format.'
        : 'Invalid session. Please sign in.',
    };
  }
}

