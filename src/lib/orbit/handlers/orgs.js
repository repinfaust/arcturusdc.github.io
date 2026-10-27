/**
 * Orbit API: Organisation Management (D-SITE-047)
 * POST /api/orbit/orgs - Create or update an organisation
 * GET /api/orbit/orgs - List all organisations, or one by ?orgId=
 *
 * Credentials: the API key is stored as a sha256 hash (K1) and shown once, on creation, together
 * with the signing secret. An update never returns or rewrites either (K5). GET returns
 * publicOrgView only, with no key, hash or secret (K3).
 * Dependencies are injected so the handlers are tested without Firebase or Next.
 */

import crypto from 'crypto';
import { publicOrgView, storedKeyFields } from '../orgKeys.js';

// For demo/PoC: deterministic credentials for the four demo orgs, so resetting and re-seeding
// doesn't break signature verification. K4 (D-SITE-047): these are in source; rotate them if
// the repository is public. Every other org gets random credentials.
const DEMO_CREDENTIALS = {
  'experian': {
    apiKey: 'org_demo_experian_12345',
    signingSecret: 'demo_secret_experian_' + 'a'.repeat(32),
  },
  'challenger_bank': {
    apiKey: 'org_demo_challenger_12345',
    signingSecret: 'demo_secret_challenger_' + 'b'.repeat(32),
  },
  'broker_app': {
    apiKey: 'org_demo_broker_12345',
    signingSecret: 'demo_secret_broker_' + 'c'.repeat(32),
  },
  'healthcare_provider': {
    apiKey: 'org_demo_healthcare_12345',
    signingSecret: 'demo_secret_healthcare_' + 'd'.repeat(32),
  },
};

function generateCredentials(orgId) {
  if (DEMO_CREDENTIALS[orgId]) {
    return DEMO_CREDENTIALS[orgId];
  }
  return {
    apiKey: `org_${crypto.randomBytes(16).toString('hex')}`,
    signingSecret: crypto.randomBytes(32).toString('hex'),
  };
}

export function makeOrgsHandlers({ verifySession, getOrg, getAllOrgs, upsertOrg, now, toTimestamp, json }) {
  const unauthenticated = (session) =>
    json({ error: session?.error || 'Authentication required' }, { status: 401 });

  async function POST(request) {
    try {
      const session = await verifySession(request);
      if (!session?.authenticated) return unauthenticated(session);

      const body = await request.json();
      const { orgId, displayName, scopes } = body;
      if (!orgId || !displayName) {
        return json({ error: 'orgId and displayName are required' }, { status: 400 });
      }

      const existing = await getOrg(orgId);

      // Set key expiration to 90 days from now (signatures expire unless re-keyed)
      const keyExpiresAt = now();
      keyExpiresAt.setDate(keyExpiresAt.getDate() + 90);

      const orgData = {
        orgId,
        displayName,
        scopes: scopes || {},
        isSandbox: body.isSandbox !== false, // Default to sandbox for PoC
        keyExpiresAt: toTimestamp(keyExpiresAt),
        signingKeyId: `org-${orgId}-key-1`, // Key version identifier
      };

      let shownOnce = {};
      if (!existing) {
        const credentials = generateCredentials(orgId);
        Object.assign(orgData, storedKeyFields(credentials.apiKey), { signingSecret: credentials.signingSecret });
        shownOnce = { apiKey: credentials.apiKey, signingSecret: credentials.signingSecret };
      }

      const docId = await upsertOrg(orgData);

      return json({
        success: true,
        org: {
          id: docId,
          orgId,
          displayName,
          scopes: orgData.scopes,
          ...(existing ? { apiKey: '[REDACTED]', signingSecret: '[REDACTED]' } : shownOnce),
        },
      });
    } catch (error) {
      console.error('Error creating/updating org:', error?.code || error?.name || 'error');
      return json({ error: 'Failed to create/update organisation' }, { status: 500 });
    }
  }

  async function GET(request) {
    try {
      const session = await verifySession(request);
      if (!session?.authenticated) return unauthenticated(session);

      const orgId = new URL(request.url).searchParams.get('orgId');
      if (orgId) {
        const org = await getOrg(orgId);
        if (!org) {
          return json({ error: 'Organisation not found' }, { status: 404 });
        }
        return json({ org: publicOrgView(org) });
      }

      const orgs = await getAllOrgs();
      return json({ orgs: orgs.map(publicOrgView) });
    } catch (error) {
      console.error('Error fetching orgs:', error?.code || error?.name || 'error');
      return json({ error: 'Failed to fetch organisations' }, { status: 500 });
    }
  }

  return { POST, GET };
}
