// Orbit live exposures (D-SITE-046, D-SITE-047). Run: npm run test:orbit (node --test).
// The route handlers take their dependencies, so these run with no Firebase and no Next.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { isOrbitOwner, ORBIT_OWNER_EMAIL } from '../../src/lib/orbit/owner.js';
import { hashApiKey, apiKeyMatches, publicOrgView, storedKeyFields } from '../../src/lib/orbit/orgKeys.js';
import { authenticateOrg } from '../../src/lib/orbit/orgAuth.js';
import { makeResetHandler } from '../../src/lib/orbit/handlers/reset.js';
import { makeOrgsHandlers } from '../../src/lib/orbit/handlers/orgs.js';

const ROOT = new URL('../..', import.meta.url).pathname;
const json = (body, init = {}) => ({ status: init.status ?? 200, body });
const req = ({ body = {}, headers = {}, url = 'https://x.test/api/orbit/orgs' } = {}) => ({
  url,
  json: async () => body,
  headers: { get: (k) => headers[k] ?? null },
});
const owner = { authenticated: true, user: { uid: 'u1', email: ORBIT_OWNER_EMAIL, emailVerified: true } };
const other = { authenticated: true, user: { uid: 'u2', email: 'someone@example.test', emailVerified: true } };
const sha = (s) => createHash('sha256').update(s).digest('hex');

// ---- owner ----
test('owner: only the verified owner email passes', () => {
  assert.equal(isOrbitOwner(owner), true);
  assert.equal(isOrbitOwner({ ...owner, user: { ...owner.user, email: ' RepInfaust@Gmail.com ' } }), true);
  assert.equal(isOrbitOwner(other), false);
  assert.equal(isOrbitOwner({ ...owner, user: { ...owner.user, emailVerified: false } }), false);
  assert.equal(isOrbitOwner({ authenticated: false }), false);
  assert.equal(isOrbitOwner(null), false);
});

// ---- (a) reset ----
function fakeDb() {
  const deleted = [];
  return {
    deleted,
    db: {
      collection: (name) => ({ where: () => ({ get: async () => ({ docs: [{ ref: { name } }] }) }) }),
      batch: () => ({ delete: (ref) => deleted.push(ref.name), commit: async () => {} }),
    },
  };
}

test('reset: a signed-in non-owner is refused and nothing is deleted', async () => {
  const f = fakeDb();
  const POST = makeResetHandler({ verifySession: async () => other, getDb: () => f.db, json });
  const res = await POST(req({ body: { userId: 'someone_else', deleteOrgs: true } }));
  assert.equal(res.status, 403);
  assert.deepEqual(f.deleted, []);
});

test('reset: signed out is 401 and nothing is deleted', async () => {
  const f = fakeDb();
  const POST = makeResetHandler({ verifySession: async () => ({ authenticated: false }), getDb: () => f.db, json });
  assert.equal((await POST(req())).status, 401);
  assert.deepEqual(f.deleted, []);
});

test('reset: the owner can reset, and the error body carries no internals', async () => {
  const f = fakeDb();
  const POST = makeResetHandler({ verifySession: async () => owner, getDb: () => f.db, json });
  const res = await POST(req({ body: {} }));
  assert.equal(res.status, 200);
  assert.ok(f.deleted.length > 0);
  const broken = makeResetHandler({ verifySession: async () => owner, getDb: () => { throw new Error('secret detail'); }, json });
  const err = await broken(req());
  assert.equal(err.status, 500);
  assert.ok(!JSON.stringify(err.body).includes('secret detail'));
});

// ---- keys: K1, K2 ----
test('K1: keys are stored as a sha256 hash, never in plaintext', () => {
  const fields = storedKeyFields('org_abc');
  assert.deepEqual(fields, { apiKeyHash: sha('org_abc'), apiKeyHashVersion: 1 });
  assert.ok(!('apiKey' in fields));
  assert.equal(hashApiKey('org_abc'), sha('org_abc'));
});

test('K2: matching is by hash, for hashed and legacy plaintext records', () => {
  assert.equal(apiKeyMatches({ apiKeyHash: sha('k1'), apiKeyHashVersion: 1 }, 'k1'), true);
  assert.equal(apiKeyMatches({ apiKeyHash: sha('k1'), apiKeyHashVersion: 1 }, 'k2'), false);
  assert.equal(apiKeyMatches({ apiKey: 'legacy' }, 'legacy'), true); // until hash-org-keys.mjs runs
  assert.equal(apiKeyMatches({ apiKey: 'legacy' }, 'legac'), false); // different length: no throw
  assert.equal(apiKeyMatches({}, 'k1'), false);
  assert.equal(apiKeyMatches({ apiKeyHash: 'not-hex' }, 'k1'), false);
  assert.equal(apiKeyMatches({ apiKeyHash: sha('k1') }, ''), false);
  assert.equal(apiKeyMatches({ apiKeyHash: sha('k1') }, null), false);
});

test('K2: no route compares API keys with !== or ===', () => {
  const files = [];
  const walk = (d) => readdirSync(d).forEach((n) => {
    const p = join(d, n);
    statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') && files.push(p);
  });
  walk(join(ROOT, 'src/app/api/orbit'));
  walk(join(ROOT, 'src/lib/orbit'));
  for (const f of files) {
    assert.doesNotMatch(readFileSync(f, 'utf8'), /apiKey\s*[!=]==(?!\s*['"]string['"])|[!=]==\s*[\w.]*apiKey\b/, f);
  }
});

test('authenticateOrg: missing headers, unknown org and wrong key are all 401-shaped', async () => {
  const getOrg = async (id) => (id === 'o1' ? { orgId: 'o1', apiKeyHash: sha('good') } : null);
  const h = (o, k) => req({ headers: { 'X-Orbit-Org-Id': o, 'X-Orbit-Api-Key': k } });
  assert.equal((await authenticateOrg(h('o1', 'good'), getOrg)).authenticated, true);
  assert.equal((await authenticateOrg(h('o1', 'bad'), getOrg)).authenticated, false);
  assert.equal((await authenticateOrg(h('nope', 'good'), getOrg)).authenticated, false);
  assert.equal((await authenticateOrg(req(), getOrg)).authenticated, false);
});

test('the three org-key routes use the shared authenticateOrg', () => {
  for (const r of ['events', 'snapshots', 'verification/request']) {
    const src = readFileSync(join(ROOT, 'src/app/api/orbit', r, 'route.js'), 'utf8');
    assert.match(src, /from '@\/lib\/orbit\/orgAuth'/, r);
    assert.doesNotMatch(src, /async function authenticateOrg/, r);
  }
});

// ---- (b) K3, K5: orgs ----
const stored = {
  id: 'doc1', orgId: 'o1', displayName: 'O1', apiKey: 'org_plain', apiKeyHash: sha('org_plain'),
  apiKeyHashVersion: 1, signingSecret: 's3cret', scopes: {},
};
const SECRET_FIELDS = ['apiKey', 'apiKeyHash', 'apiKeyHashVersion', 'signingSecret'];
const noSecrets = (body) => {
  const s = JSON.stringify(body);
  assert.ok(!s.includes('org_plain') && !s.includes('s3cret') && !s.includes(sha('org_plain')), s);
};

test('K3: publicOrgView drops every credential field', () => {
  const v = publicOrgView(stored);
  for (const f of SECRET_FIELDS) assert.ok(!(f in v), f);
  assert.equal(v.orgId, 'o1');
});

test('K3: GET /api/orbit/orgs returns no key, hash or secret, listed or single', async () => {
  const { GET } = makeOrgsHandlers({
    verifySession: async () => other, getOrg: async () => stored, getAllOrgs: async () => [stored],
    upsertOrg: async () => 'doc1', now: () => new Date(0), toTimestamp: (d) => d, json,
  });
  const list = await GET(req());
  assert.equal(list.status, 200);
  noSecrets(list.body);
  const one = await GET(req({ url: 'https://x.test/api/orbit/orgs?orgId=o1' }));
  assert.equal(one.status, 200);
  noSecrets(one.body);
});

test('K1/K5: creating an org stores only the hash and shows the key once', async () => {
  let written;
  const { POST } = makeOrgsHandlers({
    verifySession: async () => other, getOrg: async () => null, getAllOrgs: async () => [],
    upsertOrg: async (d) => { written = d; return 'doc1'; }, now: () => new Date(0), toTimestamp: (d) => d, json,
  });
  const res = await POST(req({ body: { orgId: 'fresh', displayName: 'Fresh' } }));
  assert.equal(res.status, 200);
  assert.ok(!('apiKey' in written));
  assert.equal(written.apiKeyHash, sha(res.body.org.apiKey));
  assert.match(res.body.org.apiKey, /^org_[0-9a-f]{32}$/);
});

test('K5: updating an existing org never returns or rewrites its credentials', async () => {
  let written;
  const { POST } = makeOrgsHandlers({
    verifySession: async () => other, getOrg: async () => stored, getAllOrgs: async () => [],
    upsertOrg: async (d) => { written = d; return 'doc1'; }, now: () => new Date(0), toTimestamp: (d) => d, json,
  });
  const res = await POST(req({ body: { orgId: 'o1', displayName: 'Renamed' } }));
  assert.equal(res.status, 200);
  noSecrets(res.body);
  for (const f of SECRET_FIELDS) assert.ok(!(f in written), `update must not write ${f}`);
  assert.equal(written.displayName, 'Renamed');
});

test('orgs: errors carry no internals', async () => {
  const { GET } = makeOrgsHandlers({
    verifySession: async () => other, getOrg: async () => null, getAllOrgs: async () => { throw new Error('secret detail'); },
    upsertOrg: async () => 'x', now: () => new Date(0), toTimestamp: (d) => d, json,
  });
  const res = await GET(req());
  assert.equal(res.status, 500);
  assert.ok(!JSON.stringify(res.body).includes('secret detail'));
});

// ---- K1 migration ----
import { keyMigrationFor } from '../../src/lib/orbit/orgKeys.js';

test('K1 migration: hashes a plaintext key, skips a migrated record, refuses a mismatch', () => {
  assert.deepEqual(keyMigrationFor({ orgId: 'o', apiKey: 'k' }), {
    set: { apiKeyHash: sha('k'), apiKeyHashVersion: 1 }, deletePlaintext: true,
  });
  assert.equal(keyMigrationFor({ orgId: 'o', apiKeyHash: sha('k'), apiKeyHashVersion: 1 }), null);
  assert.ok(keyMigrationFor({ orgId: 'o', apiKey: 'k', apiKeyHash: sha('k') }));
  assert.throws(() => keyMigrationFor({ orgId: 'o', apiKey: 'k', apiKeyHash: sha('other') }), /does not match/);
});
