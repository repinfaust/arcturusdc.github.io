// The real route files, with Next and Firebase faked (fakes/loader.mjs). These run unchanged
// against the pre-fix routes to show they fail there (D-SITE-050). Run: npm run test:orbit.

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { state } from './fakes/state.mjs';

const OWNER = { authenticated: true, user: { uid: 'u1', email: 'repinfaust@gmail.com', emailVerified: true } };
const OTHER = { authenticated: true, user: { uid: 'u2', email: 'someone@example.test', emailVerified: true } };
const SANDBOX_USER = 'user_12345';
const sha = (s) => createHash('sha256').update(s).digest('hex');
const route = (p) => import(`../../src/app/api/orbit/${p}/route.js`);
const req = ({ url = 'https://x.test/api', body = {} } = {}) => ({
  url, json: async () => body, headers: { get: () => null }, cookies: { get: () => undefined },
});
const LEGACY = { orgId: 'o1', displayName: 'O1', apiKey: 'org_plaintext_key', signingSecret: 's3cret', scopes: {} };
const noCredentials = (body) => {
  const s = JSON.stringify(body);
  for (const leak of ['org_plaintext_key', 's3cret', sha('org_plaintext_key')]) assert.ok(!s.includes(leak), `leaked: ${s}`);
  assert.doesNotMatch(s, /"apiKey(Hash)?"\s*:\s*"(?!\[REDACTED\])/);
};

beforeEach(() => state.reset());

// ---- D-SITE-046: reset ----
test('route reset: a signed-in non-owner gets 403 and nothing is deleted', async () => {
  state.session = OTHER;
  const { POST } = await route('reset');
  const res = await POST(req({ body: { userId: 'victim', deleteOrgs: true } }));
  assert.equal(res.status, 403);
  assert.deepEqual(state.deleted, []);
});

test('route reset: the owner can reset', async () => {
  state.session = OWNER;
  const { POST } = await route('reset');
  assert.equal((await POST(req({ body: {} }))).status, 200);
  assert.ok(state.deleted.length > 0);
});

// ---- D-SITE-047: orgs ----
test('route orgs GET: no key, hash or secret, listed or single', async () => {
  state.session = OTHER;
  state.orgs = [LEGACY];
  const { GET } = await route('orgs');
  const list = await GET(req({ url: 'https://x.test/api/orbit/orgs' }));
  assert.equal(list.status, 200);
  noCredentials(list.body);
  const one = await GET(req({ url: 'https://x.test/api/orbit/orgs?orgId=o1' }));
  assert.equal(one.status, 200);
  noCredentials(one.body);
});

test('route orgs POST update: the existing key is neither returned nor rewritten', async () => {
  state.session = OTHER;
  state.orgs = [LEGACY];
  const { POST } = await route('orgs');
  const res = await POST(req({ body: { orgId: 'o1', displayName: 'Renamed' } }));
  assert.equal(res.status, 200);
  noCredentials(res.body);
  for (const f of ['apiKey', 'apiKeyHash', 'signingSecret']) assert.ok(!(f in state.upserts[0]), f);
});

test('route orgs POST create: only a hash is stored', async () => {
  state.session = OTHER;
  const { POST } = await route('orgs');
  const res = await POST(req({ body: { orgId: 'fresh', displayName: 'Fresh' } }));
  assert.equal(res.status, 200);
  assert.ok(!('apiKey' in state.upserts[0]), 'plaintext key stored');
  assert.equal(state.upserts[0].apiKeyHash, sha(res.body.org.apiKey));
});

// ---- D-SITE-050: reads ----
const READS = [
  ['events', 'events', (u) => `https://x.test/api/orbit/events?userId=${u}`],
  ['alerts', 'alerts', (u) => `https://x.test/api/orbit/alerts?userId=${u}`],
  ['consent', 'consent', (u) => `https://x.test/api/orbit/consent?userId=${u}`],
  ['snapshots', 'latestSnapshot', (u) => `https://x.test/api/orbit/snapshots?userId=${u}&orgId=o1`],
];

for (const [path, what, url] of READS) {
  test(`route ${path} GET: a non-owner can't read another user's records`, async () => {
    state.session = OTHER;
    const { GET } = await route(path);
    const res = await GET(req({ url: url('victim') }));
    assert.equal(res.status, 403);
    assert.deepEqual(state.reads.filter(([w]) => w === what), []);
  });

  test(`route ${path} GET: a non-owner can still read the shared sandbox user`, async () => {
    state.session = OTHER;
    const { GET } = await route(path);
    assert.equal((await GET(req({ url: url(SANDBOX_USER) }))).status, 200);
  });

  test(`route ${path} GET: the owner can read any user`, async () => {
    state.session = OWNER;
    const { GET } = await route(path);
    assert.equal((await GET(req({ url: url('victim') }))).status, 200);
  });
}

test('route snapshots GET by pointer: another user\'s snapshot reads as not found', async () => {
  state.session = OTHER;
  const fake = await import('./fakes/db-admin.mjs');
  fake.setSnapshot({ id: 'p1', userId: 'victim', data: { x: 1 } });
  const { GET } = await route('snapshots');
  const res = await GET(req({ url: 'https://x.test/api/orbit/snapshots?snapshotPointer=p1' }));
  assert.equal(res.status, 404);
  assert.ok(!JSON.stringify(res.body).includes('victim'));
  state.session = OWNER;
  assert.equal((await GET(req({ url: 'https://x.test/api/orbit/snapshots?snapshotPointer=p1' }))).status, 200);
});
