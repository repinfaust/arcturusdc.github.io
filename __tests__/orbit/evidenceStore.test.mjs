// The evidence store (D-SITE-056): its own collection, one chain per org, every append moving
// the head in the same transaction.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { memoryFirestore } from './fakes/memoryFirestore.mjs';
import { appendEvidenceEvent, readEvidenceChain, EVIDENCE_COLLECTIONS } from '../../src/lib/orbit/evidenceStore.js';
import { verifyChainV2 } from '../../src/lib/orbit/chainV2.js';
import { readFileSync } from 'node:fs';

const SECRET = 's'.repeat(64);
const ORG = 'evidence-org';
const ts = () => 'SERVER_TS';
const payload = (n, extra = {}) => ({
  eventType: 'RUBRIC_VERSIONED', orgId: ORG, eventId: `ev_${n}`.padEnd(6, '0'), system: 'sys-a',
  rubricHash: '84e80788c7ea', commit: '778550f', decisionId: 'D-034', occurredAt: '2026-08-08', chainVersion: 2, ...extra,
});
const append = (db, n, opts = {}) => appendEvidenceEvent(db, {
  orgId: ORG, payload: payload(n), signingSecret: SECRET, signingKeyId: `${ORG}-key-1`, serverTimestamp: ts, ...opts,
});

test('collections are separate from the POC ledger', () => {
  assert.deepEqual(EVIDENCE_COLLECTIONS, { EVENTS: 'orbit_evidence_events', HEADS: 'orbit_evidence_heads' });
});

test('appends link, store and move the head; the stored chain verifies', async () => {
  const db = memoryFirestore();
  for (let i = 1; i <= 3; i++) await append(db, i);
  const { events, head } = await readEvidenceChain(db, ORG);
  assert.equal(events.length, 3);
  assert.deepEqual(events.map((e) => e.blockIndex), [1, 2, 3]);
  assert.deepEqual(head, { orgId: ORG, blockIndex: 3, eventHash: events[2].eventHash, updatedAt: 'SERVER_TS' });
  assert.equal(events[0].recordedAt, 'SERVER_TS');
  const r = verifyChainV2(events, SECRET, head);
  assert.equal(r.ok, true, r.errors.join('; '));
});

test('concurrent appends serialise into one chain, no fork', async () => {
  const db = memoryFirestore();
  await Promise.all([1, 2, 3, 4, 5].map((i) => append(db, i)));
  const { events, head } = await readEvidenceChain(db, ORG);
  assert.equal(new Set(events.map((e) => e.blockIndex)).size, 5);
  assert.equal(verifyChainV2(events, SECRET, head).ok, true);
});

test('expectHead: an append refuses when the head has moved', async () => {
  const db = memoryFirestore();
  const first = await append(db, 1, { expectHead: null });
  await assert.rejects(append(db, 2, { expectHead: null }), /head has moved/);
  await append(db, 2, { expectHead: { blockIndex: 1, eventHash: first.eventHash } });
  assert.equal((await readEvidenceChain(db, ORG)).events.length, 2);
});

test('refusals write nothing: invalid payload, wrong org, free text', async () => {
  const db = memoryFirestore();
  await assert.rejects(append(db, 1, { payload: payload(1, { note: 'free text' }) }), /unknown field: note/);
  await assert.rejects(append(db, 1, { payload: payload(1, { orgId: 'other-org' }) }), /orgId/);
  assert.equal(db.docs.size, 0);
});

test('an existing block is never overwritten', async () => {
  const db = memoryFirestore();
  await append(db, 1);
  db.docs.delete(`orbit_evidence_heads/${ORG}`); // a lost head must not let block 1 be rewritten
  await assert.rejects(append(db, 2), /ALREADY_EXISTS/);
  assert.equal((await readEvidenceChain(db, ORG)).events[0].eventId, payload(1).eventId);
});

test('another org has its own chain', async () => {
  const db = memoryFirestore();
  await append(db, 1);
  await appendEvidenceEvent(db, { orgId: 'org-b', payload: payload(1, { orgId: 'org-b' }), signingSecret: SECRET, signingKeyId: 'b-key-1', serverTimestamp: ts });
  assert.equal((await readEvidenceChain(db, 'org-b')).events[0].blockIndex, 1);
});

test('firestore.rules: both evidence collections deny all client access', () => {
  const rules = readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8');
  for (const c of ['orbit_evidence_events', 'orbit_evidence_heads']) {
    assert.match(rules, new RegExp(`match /${c}/\\{\\w+\\} \\{\\s*allow read, write: if false;\\s*\\}`), c);
  }
});
