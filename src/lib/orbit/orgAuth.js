/**
 * Orbit org authentication (D-SITE-047)
 * One copy, replacing the three in events, snapshots and verification/request.
 */

import { apiKeyMatches } from './orgKeys.js';

export async function authenticateOrg(request, getOrg) {
  const orgId = request.headers.get('X-Orbit-Org-Id');
  const apiKey = request.headers.get('X-Orbit-Api-Key');

  if (!orgId || !apiKey) {
    return { authenticated: false, error: 'Missing X-Orbit-Org-Id or X-Orbit-Api-Key headers' };
  }

  const org = await getOrg(orgId);
  if (!apiKeyMatches(org, apiKey)) {
    return { authenticated: false, error: 'Invalid org credentials' };
  }

  return { authenticated: true, org };
}
