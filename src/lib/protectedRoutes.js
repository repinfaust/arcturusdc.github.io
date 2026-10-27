/**
 * Server-side page gates (D-SITE-064)
 *
 * The root middleware.js listed these routes but never ran (D-SITE-061: with the app in src/,
 * Next.js only loads src/middleware.js). Each route folder now has a server layout that calls
 * enforceGate (serverGate.js) with its base. /stea/... vanity paths are rewrites to these, so they
 * are gated too. App and workspace access is still checked client-side by SteaAppAccessGate.
 *
 * Rules: signed in (default); `email` for one account (Repinfaust); `owner` for the Orbit
 * owner, answered with a 404 so the route doesn't confirm it exists.
 */

import { isOrbitOwner } from './orbit/owner.js';

export const SIGN_IN_PATH = '/apps/stea';

export const PROTECTED_ROUTES = [
  { base: '/apps/stea/admin' },
  { base: '/apps/stea/automatedtestsdashboard' },
  { base: '/apps/stea/art-atlas' },
  { base: '/apps/stea/autoproduct' },
  { base: '/apps/stea/career' },
  { base: '/apps/stea/squared' },
  { base: '/apps/stea/dialled-mtb' },
  { base: '/apps/stea/dialledmtb-riders' },
  { base: '/apps/stea/filo' },
  { base: '/apps/stea/hans' },
  { base: '/apps/stea/harls' },
  { base: '/apps/stea/orbit/poc' },
  { base: '/apps/stea/orbit/AI-Act-Technical-DocumentationBundle' },
  { base: '/apps/stea/orbit/evidence', owner: true },
  { base: '/apps/stea/repinfaust', email: 'repinfaust@gmail.com', denied: 'repinfaust' },
  { base: '/apps/stea/fof' },
  { base: '/apps/stea/wc26' },
];

export function gateDecision(session, rule) {
  if (rule.owner) return isOrbitOwner(session) ? { allow: true } : { notFound: true };
  if (!session?.authenticated) return { redirect: `${SIGN_IN_PATH}?next=${encodeURIComponent(rule.base)}` };
  if (rule.email) {
    const email = typeof session.user?.email === 'string' ? session.user.email.trim().toLowerCase() : '';
    if (email !== rule.email || session.user.emailVerified !== true) {
      return { redirect: `${SIGN_IN_PATH}?denied=${encodeURIComponent(rule.denied)}` };
    }
  }
  return { allow: true };
}
