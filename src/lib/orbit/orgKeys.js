/**
 * Orbit org API keys (D-SITE-047)
 * Keys are stored as sha256 hashes and compared in constant time. They are 128 random bits,
 * so a slow KDF adds nothing. The plaintext is shown once, on creation, and never stored.
 * A legacy record still holding a plaintext `apiKey` matches until scripts/orbit/hash-org-keys.mjs
 * has run; it is compared on hashes too, so its length never leaks and nothing throws.
 */

import crypto from 'crypto';

export const API_KEY_HASH_VERSION = 1;
const CREDENTIAL_FIELDS = ['apiKey', 'apiKeyHash', 'apiKeyHashVersion', 'signingSecret'];

export function hashApiKey(apiKey) {
  return crypto.createHash('sha256').update(String(apiKey)).digest('hex');
}

export function storedKeyFields(apiKey) {
  return { apiKeyHash: hashApiKey(apiKey), apiKeyHashVersion: API_KEY_HASH_VERSION };
}

export function apiKeyMatches(org, presented) {
  if (!org || typeof presented !== 'string' || presented.length === 0) return false;
  let expected;
  if (typeof org.apiKeyHash === 'string' && /^[0-9a-f]{64}$/.test(org.apiKeyHash)) {
    expected = Buffer.from(org.apiKeyHash, 'hex');
  } else if (typeof org.apiKey === 'string' && org.apiKey.length > 0) {
    expected = Buffer.from(hashApiKey(org.apiKey), 'hex');
  } else {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(hashApiKey(presented), 'hex'), expected);
}

/** An org as any caller may see it: no key, no hash, no signing secret. */
export function publicOrgView(org) {
  const view = { ...org };
  for (const field of CREDENTIAL_FIELDS) delete view[field];
  return view;
}

/**
 * What scripts/orbit/hash-org-keys.mjs does to one stored org (K1 migration):
 * null when there is no plaintext key; otherwise the hash to set and the plaintext to delete.
 * Refuses a record whose existing hash disagrees with its plaintext, rather than pick one.
 */
export function keyMigrationFor(org) {
  if (typeof org?.apiKey !== 'string' || org.apiKey.length === 0) return null;
  const fields = storedKeyFields(org.apiKey);
  if (org.apiKeyHash && org.apiKeyHash !== fields.apiKeyHash) {
    throw new Error(`org ${org.orgId}: stored apiKeyHash does not match its plaintext key`);
  }
  return { set: fields, deletePlaintext: true };
}
