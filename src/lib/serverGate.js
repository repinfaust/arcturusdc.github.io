/**
 * Runs a page gate in a server layout (D-SITE-064). Node runtime, so firebase-admin is fine here,
 * unlike in middleware. The session cookie is checked with revocation, as the old middleware did.
 */

import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { sessionFromCookie } from '@/lib/orbit/serverSession';
import { PROTECTED_ROUTES, gateDecision } from '@/lib/protectedRoutes';

export async function enforceGate(base) {
  const rule = PROTECTED_ROUTES.find((r) => r.base === base);
  if (!rule) throw new Error(`no gate rule for ${base}`);
  let auth = null;
  try {
    auth = getFirebaseAdmin().auth;
  } catch {
    auth = null; // no admin credentials: treated as signed out, so the gate fails closed
  }
  const session = await sessionFromCookie(cookies().get('__session')?.value, auth);
  const d = gateDecision(session, rule);
  if (d.notFound) notFound();
  if (d.redirect) redirect(d.redirect);
}
