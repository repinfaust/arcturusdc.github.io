/**
 * Session check for server components (D-SITE-059), the same shape as auth.js's verifySession,
 * which reads the cookie from a route's request instead. Revocation is checked.
 */

export async function sessionFromCookie(sessionCookie, auth) {
  if (!sessionCookie || !auth) return { authenticated: false };
  try {
    const claims = await auth.verifySessionCookie(sessionCookie, true);
    return {
      authenticated: true,
      user: { uid: claims.uid, email: claims.email, emailVerified: claims.email_verified === true },
    };
  } catch {
    return { authenticated: false };
  }
}
