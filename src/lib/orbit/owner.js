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

/**
 * The POC sandbox's shared demo user. Every signed-in visitor to /apps/stea/orbit/poc writes to
 * and reads from this one id, so reading it exposes nothing they can't already write.
 */
export const SANDBOX_USER_ID = 'user_12345';

/**
 * Who may read a user's ledger records (D-SITE-050): the owner, any user; anyone else signed in,
 * the sandbox user only. Before this, any signed-in account could read any userId.
 */
export function canReadUserRecords(session, userId) {
  if (!session?.authenticated) return false;
  return isOrbitOwner(session) || userId === SANDBOX_USER_ID;
}
