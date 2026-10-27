// POST /api/orbit/verify (D-SITE-058). Chain mode fetches the stored chain server-side and walks
// it; the old single-event mode is kept for the POC, minus the 500 on a malformed signature.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeVerifyHandler } from '../../src/lib/orbit/handlers/verify.js';
import { appendEvidenceEvent, readEvidenceChain, EVIDENCE_COLLECTIONS } from '../../src/lib/orbit/evidenceStore.js';
import { signEvent, hashEvent } from '../../src/lib/orbit/signatures.js';
import { memoryFirestore } from './fakes/memoryFirestore.mjs';

const OWNER = { authenticated: true, user: { uid: 'u1', email: 'repinfaust@gmail.com', emailVerified: true } };
const OTHER = { authenticated: true, user: { uid: 'u2', email: 'someone@example.test', emailVerified: true } };
const ORG = 'evidence-org';
const SECRET = 'e'.repeat(64);
const json = (body, init = {}) => ({ status: init.status ?? 200, body });
const req = (body) => ({ json: async () => body });
const payload = (n) => ({
  eventType: 'EVALUATION_RUN', orgId: ORG, eventId: `ev_${n}xx`, system: 'sys-a', version: 'v1', commit: 'abcdef1',
  modelSnapshots: [], decisionId: 'D-001', metrics: { rows: 10 * n }, occurredAt: '2026-10-26', chainVersion: 2,
});

async function setup(session, n = 3) {
  const db = memoryFirestore();
  for (let i = 1; i <= n; i++) {
    await appendEvidenceEvent(db, { orgId: ORG, payload: payload(i), signingSecret: SECRET, signingKeyId: 'k1', serverTimestamp: () => 'ts' });
  }
  const orgs = { [ORG]: { orgId: ORG, signingSecret: SECRET }, experian: { orgId: 'experian', signingSecret: 'demo' } };
  const snapshots = {};
  const POST = makeVerifyHandler({
    verifySession: async () => session,
    getOrg: async (id) => orgs[id] ?? null,
    getSnapshot: async (p) => snapshots[p] ?? null,
    readChain: (orgId) => readEvidenceChain(db, orgId),
    now: () => new Date('2026-10-27T12:00:00Z'),
    json,
  });
  return { db, POST, snapshots };
}

test('chain mode: the owner gets every block checked against the stored chain, scoped', async () => {
  const { POST } = await setup(OWNER);
  const res = await POST(req({ orgId: ORG, chain: true }));
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true, JSON.stringify(res.body.errors));
  assert.equal(res.body.blocks.length, 3);
  assert.ok(res.body.blocks.every((b) => b.signature && b.hash && b.link && b.schema));
  assert.equal(res.body.head.blockIndex, 3);
  assert.equal(res.body.verifiedAt, '2026-10-27T12:00:00.000Z');
  assert.match(res.body.scope, /verified by Orbit, not independently/);
});

test('chain mode: a stored edit is caught, and the response names the block, never the value', async () => {
  const { db, POST } = await setup(OWNER);
  const path = `${EVIDENCE_COLLECTIONS.EVENTS}/${ORG}__00000002`;
  db.docs.set(path, { ...db.docs.get(path), metrics: { rows: 999999 } });
  const res = await POST(req({ orgId: ORG, chain: true }));
  assert.equal(res.body.ok, false);
  assert.deepEqual(res.body.blocks.map((b) => b.signature), [true, false, true]);
  assert.ok(res.body.errors.some((e) => /block 2/.test(e)));
  assert.ok(!JSON.stringify(res.body).includes('999999'));
});

test('chain mode: a deleted block is caught', async () => {
  const { db, POST } = await setup(OWNER);
  db.docs.delete(`${EVIDENCE_COLLECTIONS.EVENTS}/${ORG}__00000002`);
  assert.equal((await POST(req({ orgId: ORG, chain: true }))).body.ok, false);
});

test('chain mode: owner only; unknown org is 404; signed out is 401', async () => {
  assert.equal((await (await setup(OTHER)).POST(req({ orgId: ORG, chain: true }))).status, 403);
  assert.equal((await (await setup(OWNER)).POST(req({ orgId: 'nope', chain: true }))).status, 404);
  assert.equal((await (await setup({ authenticated: false })).POST(req({ orgId: ORG, chain: true }))).status, 401);
});

test('chain mode: an empty chain is not "verified"', async () => {
  const { POST } = await setup(OWNER, 0);
  const res = await POST(req({ orgId: ORG, chain: true }));
  assert.equal(res.body.ok, false);
  assert.match(res.body.errors.join(' '), /no blocks/);
});

// ---- the POC's single-event mode, kept ----
const legacy = () => {
  const e = { eventType: 'CONSENT_GRANTED', userId: 'user_12345', orgId: 'experian', consentScope: 's', consentStatus: 'GRANTED', eventId: 'evt_1' };
  e.signature = signEvent(e, 'demo');
  e.previousEventHash = 'p';
  e.blockIndex = 2;
  e.eventHash = hashEvent(e);
  return e;
};

test('event mode: unchanged for the POC (signature and v1 hash checks, simulated tampering)', async () => {
  const { POST } = await setup(OTHER);
  const ok = await POST(req({ event: legacy() }));
  assert.equal(ok.body.results.eventSignature.verified, true);
  assert.equal(ok.body.results.hashChain.verified, true);
  const t = await POST(req({ event: legacy(), simulateTampering: true }));
  assert.equal(t.body.results.eventSignature.verified, false);
});

test('event mode: a malformed signature is "not verified", not a 500 (F3)', async () => {
  const { POST } = await setup(OTHER);
  const res = await POST(req({ event: { ...legacy(), signature: 'abc' } }));
  assert.equal(res.status, 200);
  assert.equal(res.body.results.eventSignature.verified, false);
});

test('event mode: another user\'s snapshot is not looked up', async () => {
  const { POST, snapshots } = await setup(OTHER);
  snapshots.p1 = { userId: 'victim', data: { a: 1 }, snapshotHash: 'x'.repeat(64) };
  const res = await POST(req({ event: legacy(), snapshotPointer: 'p1' }));
  assert.equal(res.body.results.snapshotHash, null);
});
