/**
 * Orbit owner check (D-SITE-046)
 * Destructive and evidence routes are owner-only. A signed-in session alone is not enough:
 * verifySession accepts any account that can sign in to STEa.
 */

export const ORBIT_OWNER_EMAIL = 'repinfaust@gmail.com';

export function isOrbitOwner(session) {
  if (!session?.authenticated || !session.user) return false;
  const email = typeof session.user.email === 'string' ? session.user.email.trim().toLowerCase() : '';
  return session.user.emailVerified === true && email === ORBIT_OWNER_EMAIL;
}
