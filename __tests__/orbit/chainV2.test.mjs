// Chain v2 (D-SITE-054): every value signed and hashed, and each hash commits to its
// predecessor. The same properties run against v1 as `todo`, so the run shows them failing
// there every time (F1, F2). v1's own behaviour is pinned byte for byte, since stored POC
// events must keep verifying.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canonicalV2, signEventV2, eventHashV2, verifySignatureV2, linkEventV2, verifyChainV2, GENESIS_HASH } from '../../src/lib/orbit/chainV2.js';
import { signEvent, hashEvent, verifyEventSignature } from '../../src/lib/orbit/signatures.js';

const SECRET = 'test-secret-'.padEnd(64, 'x');
const payload = (n, metrics = { rows: 693, misses: 0 }) => ({
  eventType: 'EVALUATION_RUN', orgId: 'evidence-org', eventId: `ev_${String(n).padStart(4, '0')}`,
  system: 'sys-a', version: 'lab-1.0', commit: '6881375', modelSnapshots: ['model-a'],
  decisionId: 'D-L031', metrics, occurredAt: '2026-10-26', chainVersion: 2,
});

function buildChain(n) {
  const out = [];
  let head = null;
  for (let i = 1; i <= n; i++) {
    const e = linkEventV2(payload(i), head, SECRET, 'evidence-org-key-1');
    out.push(e);
    head = { blockIndex: e.blockIndex, eventHash: e.eventHash };
  }
  return out;
}

// ---- canonical form ----
test('canonicalV2: sorted at every depth, stable, covers nested values', () => {
  assert.equal(canonicalV2({ b: 1, a: { d: [3, { z: 1, y: 2 }], c: 'x' } }), '{"a":{"c":"x","d":[3,{"y":2,"z":1}]},"b":1}');
  assert.equal(canonicalV2({ a: 1, b: 2 }), canonicalV2({ b: 2, a: 1 }));
  assert.notEqual(canonicalV2({ m: { k: 1 } }), canonicalV2({ m: { k: 2 } }));
});

test('canonicalV2: refuses anything that is not plain JSON', () => {
  for (const v of [{ a: undefined }, { a: NaN }, { a: Infinity }, { a: new Date(0) }, { a: () => 1 }, { a: 1n }, { a: new Map() }, { a: { _seconds: 1, _nanoseconds: 0, toDate() {} } }]) {
    assert.throws(() => canonicalV2(v), /canonicalV2/, JSON.stringify(Object.keys(v)));
  }
});

// ---- properties, v2 must pass, v1 shown failing ----
const V1 = {
  sign: (e, s) => signEvent(e, s),
  hash: (e) => hashEvent(e),
};
const V2 = {
  sign: (e, s) => signEventV2(e, s),
  hash: (e) => eventHashV2(e),
};

function properties(impl, todo) {
  const opts = todo ? { todo } : {};
  test(`${todo ? 'v1' : 'v2'}: changing a nested metric changes the signature (F2)`, opts, () => {
    const a = payload(1, { rows: 693 });
    const b = payload(1, { rows: 692 });
    assert.notEqual(impl.sign(a, SECRET), impl.sign(b, SECRET));
  });
  test(`${todo ? 'v1' : 'v2'}: relinking an event changes its hash (F1)`, opts, () => {
    const e = { ...payload(2), signature: 'ab'.repeat(32), previousEventHash: 'a'.repeat(64), blockIndex: 2 };
    assert.notEqual(impl.hash(e), impl.hash({ ...e, previousEventHash: 'b'.repeat(64) }));
    assert.notEqual(impl.hash(e), impl.hash({ ...e, blockIndex: 3 }));
  });
}
properties(V2);
properties(V1, 'known v1 defect, kept for stored POC events');

// ---- v1 pinned ----
test('v1 is unchanged: a fixed legacy event keeps its signature and hash', () => {
  const legacy = { eventType: 'CONSENT_GRANTED', userId: 'user_12345', orgId: 'experian', consentScope: 'basic_identity', consentStatus: 'GRANTED', eventId: 'evt_1_abc' };
  const sig = signEvent(legacy, 'demo_secret_experian_' + 'a'.repeat(32));
  assert.equal(sig, V1_PIN.sig);
  assert.equal(hashEvent({ ...legacy, signature: sig, previousEventHash: 'p', blockIndex: 2 }), V1_PIN.hash);
  assert.equal(verifyEventSignature({ ...legacy, signature: sig }, 'demo_secret_experian_' + 'a'.repeat(32)), true);
});
// Computed from signatures.js at 323a05c, unchanged since ebe08f9.
const V1_PIN = {
  sig: 'c01857535c60e3848d0496ec333ad79fbc5f9a6907da475481fb13315244ebc4',
  hash: 'd1f7933ccde20ac65e782c476680e255f75082c3923928952aab2e2171cb1aca',
};

// ---- signatures ----
test('verifySignatureV2: constant-time, false (not a throw) on any malformed signature', () => {
  const [e] = buildChain(1);
  assert.equal(verifySignatureV2(e, SECRET), true);
  assert.equal(verifySignatureV2(e, 'other-secret'), false);
  for (const sig of [undefined, '', 'zz', 'ab', e.signature.slice(2), e.signature + '00', 123]) {
    assert.equal(verifySignatureV2({ ...e, signature: sig }, SECRET), false, String(sig));
  }
});

// ---- linking ----
test('linkEventV2: block 1 links to genesis; later blocks to the head; validates first', () => {
  const [a, b] = buildChain(2);
  assert.equal(a.blockIndex, 1);
  assert.equal(a.previousEventHash, GENESIS_HASH);
  assert.equal(b.blockIndex, 2);
  assert.equal(b.previousEventHash, a.eventHash);
  assert.match(a.eventHash, /^[0-9a-f]{64}$/);
  assert.equal(a.signingKeyId, 'evidence-org-key-1');
  assert.throws(() => linkEventV2({ ...payload(3), note: 'free text' }, null, SECRET, 'k'), /unknown field: note/);
  assert.throws(() => linkEventV2({ ...payload(3), signature: 'x' }, null, SECRET, 'k'), /unknown field: signature/);
});

// ---- chain verification ----
test('verifyChainV2: an intact chain verifies', () => {
  const chain = buildChain(5);
  const r = verifyChainV2(chain, SECRET, { blockIndex: 5, eventHash: chain[4].eventHash });
  assert.equal(r.ok, true, r.errors.join('; '));
  assert.equal(r.blocks.length, 5);
  assert.ok(r.blocks.every((b) => b.signature && b.hash && b.link));
});

test('verifyChainV2: detects an edited metric, a reorder, a deletion, a relink, and a stale head', () => {
  const chain = buildChain(4);
  const head = { blockIndex: 4, eventHash: chain[3].eventHash };
  const cases = {
    edited: chain.map((e, i) => (i === 1 ? { ...e, metrics: { ...e.metrics, rows: 1 } } : e)),
    reordered: [chain[0], chain[2], chain[1], chain[3]],
    deleted: [chain[0], chain[2], chain[3]],
    relinked: chain.map((e, i) => (i === 2 ? { ...e, previousEventHash: chain[0].eventHash } : e)),
    truncatedTail: chain.slice(0, 3),
    resigned: chain.map((e, i) => (i === 1 ? { ...e, signature: signEventV2({ ...e, metrics: { rows: 1, misses: 0 } }, SECRET), metrics: { rows: 1, misses: 0 } } : e)),
  };
  for (const [name, c] of Object.entries(cases)) {
    const r = verifyChainV2(c, SECRET, head);
    assert.equal(r.ok, false, `${name} should fail`);
  }
});

test('verifyChainV2: a v1 or unknown-version event is refused, not silently skipped', () => {
  const chain = buildChain(2);
  const r = verifyChainV2([chain[0], { ...chain[1], chainVersion: 1 }], SECRET, { blockIndex: 2, eventHash: chain[1].eventHash });
  assert.equal(r.ok, false);
});
