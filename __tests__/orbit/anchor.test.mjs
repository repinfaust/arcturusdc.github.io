// RFC 3161 anchoring of the evidence head (D-SITE-063), against local test TSAs only.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { anchorImprint, anchorDocId, ANCHOR_TSAS, checkAnchors } from '../../src/lib/orbit/anchors.js';
import { makeQuery, verifyReply, anchorHead } from '../../scripts/orbit/anchor.mjs';
import { appendEvidenceEvent, readEvidenceChain } from '../../src/lib/orbit/evidenceStore.js';
import { memoryFirestore } from './fakes/memoryFirestore.mjs';
import { localTsa } from './fakes/localTsa.mjs';

const ORG = 'evidence-org';
const SECRET = 'a'.repeat(64);
const NOW = () => new Date();
const digicert = localTsa({ org: 'DigiCert Test', policy: '1.3.6.1.4.1.99999.1' });
const sectigo = localTsa({ org: 'Sectigo Test' });
const rogue = localTsa({ org: 'Rogue Test' });
const TSAS = [
  { id: 'digicert', url: 'local:digicert', vendor: 'DigiCert', caFile: digicert.caFile, post: digicert.post },
  { id: 'sectigo', url: 'local:sectigo', vendor: 'Sectigo', caFile: sectigo.caFile, post: sectigo.post },
];
const payload = (n) => ({ eventType: 'EVALUATION_RUN', orgId: ORG, eventId: `ev_${n}aa`, system: 'sys-a', version: 'v1', commit: 'abcdef1', modelSnapshots: [], decisionId: 'D-001', metrics: { n }, occurredAt: '2026-10-26', chainVersion: 2 });
async function chain(n = 2) {
  const db = memoryFirestore();
  for (let i = 1; i <= n; i++) await appendEvidenceEvent(db, { orgId: ORG, payload: payload(i), signingSecret: SECRET, signingKeyId: 'k', serverTimestamp: () => 'ts' });
  return db;
}

test('the configured TSAs are DigiCert and Sectigo', () => {
  assert.deepEqual(ANCHOR_TSAS.map((t) => [t.id, t.url, t.vendor]), [
    ['digicert', 'http://timestamp.digicert.com', 'DigiCert'],
    ['sectigo', 'http://timestamp.sectigo.com', 'Sectigo'],
  ]);
});

test('imprint: sha256 of the canonical head record; any change changes it', () => {
  const h = { orgId: ORG, blockIndex: 3, eventHash: 'f'.repeat(64) };
  assert.match(anchorImprint(h), /^[0-9a-f]{64}$/);
  assert.equal(anchorImprint(h), anchorImprint({ ...h }));
  assert.notEqual(anchorImprint(h), anchorImprint({ ...h, blockIndex: 4 }));
  assert.notEqual(anchorImprint(h), anchorImprint({ ...h, eventHash: 'e'.repeat(64) }));
  assert.equal(anchorDocId(ORG, 3), `${ORG}__00000003`);
});

test('a genuine reply verifies, and its time, serial and policy are read', async () => {
  const imprint = anchorImprint({ orgId: ORG, blockIndex: 1, eventHash: 'a'.repeat(64) });
  const q = makeQuery(imprint);
  const r = verifyReply({ queryDer: q, replyDer: await digicert.post(q), caFile: digicert.caFile, vendor: 'DigiCert', now: NOW() });
  assert.equal(r.ok, true, r.error);
  assert.equal(r.status, 'Granted');
  assert.ok(Math.abs(Date.parse(r.genTime) - Date.now()) < 120_000);
  assert.match(r.serial, /^0x[0-9A-Fa-f]+$/);
  assert.equal(r.policy, '1.3.6.1.4.1.99999.1');
});

test('refused: a reply to another query, the wrong CA, the wrong vendor, a skewed clock', async () => {
  const q1 = makeQuery(anchorImprint({ orgId: ORG, blockIndex: 1, eventHash: 'a'.repeat(64) }));
  const q2 = makeQuery(anchorImprint({ orgId: ORG, blockIndex: 2, eventHash: 'b'.repeat(64) }));
  const reply1 = await digicert.post(q1);
  assert.equal(verifyReply({ queryDer: q2, replyDer: reply1, caFile: digicert.caFile, vendor: 'DigiCert', now: NOW() }).ok, false);
  assert.equal(verifyReply({ queryDer: q1, replyDer: reply1, caFile: sectigo.caFile, vendor: 'DigiCert', now: NOW() }).ok, false);
  const rogueReply = await rogue.post(q1);
  const v = verifyReply({ queryDer: q1, replyDer: rogueReply, caFile: rogue.caFile, vendor: 'DigiCert', now: NOW() });
  assert.equal(v.ok, false);
  assert.match(v.error, /vendor/);
  const skew = verifyReply({ queryDer: q1, replyDer: reply1, caFile: digicert.caFile, vendor: 'DigiCert', now: new Date(Date.now() + 3_600_000) });
  assert.equal(skew.ok, false);
  assert.match(skew.error, /time/);
  assert.equal(verifyReply({ queryDer: q1, replyDer: Buffer.from('not der'), caFile: digicert.caFile, vendor: 'DigiCert', now: NOW() }).ok, false);
});

test('anchorHead: both TSAs verified, then one record; a second run is a no-op', async () => {
  const db = await chain(2);
  const r = await anchorHead(db, { orgId: ORG, tsas: TSAS, now: NOW, serverTimestamp: () => 'ts' });
  assert.equal(r.status, 'anchored');
  assert.equal(r.blockIndex, 2);
  const doc = db.docs.get(`orbit_evidence_anchors/${anchorDocId(ORG, 2)}`);
  assert.deepEqual(Object.keys(doc.tokens).sort(), ['digicert', 'sectigo']);
  assert.equal(doc.imprint, anchorImprint({ orgId: ORG, blockIndex: 2, eventHash: doc.eventHash }));
  assert.ok(Buffer.from(doc.tokens.digicert.replyDer, 'base64').length > 100);
  assert.equal((await anchorHead(db, { orgId: ORG, tsas: TSAS, now: NOW, serverTimestamp: () => 'ts' })).status, 'already-anchored');
});

test('anchorHead: if either TSA fails, nothing is stored', async () => {
  const db = await chain(1);
  const broken = [TSAS[0], { ...TSAS[1], post: async () => { throw new Error('connection refused'); } }];
  await assert.rejects(anchorHead(db, { orgId: ORG, tsas: broken, now: NOW, serverTimestamp: () => 'ts' }), /sectigo: connection refused/);
  const wrongVendor = [TSAS[0], { ...TSAS[1], caFile: rogue.caFile, post: rogue.post }];
  await assert.rejects(anchorHead(db, { orgId: ORG, tsas: wrongVendor, now: NOW, serverTimestamp: () => 'ts' }), /sectigo/);
  assert.equal([...db.docs.keys()].filter((k) => k.startsWith('orbit_evidence_anchors/')).length, 0);
});

test('anchorHead: dry run sends nothing', async () => {
  const db = await chain(1);
  let sent = 0;
  const counting = TSAS.map((t) => ({ ...t, post: async (q) => { sent++; return t.post(q); } }));
  const r = await anchorHead(db, { orgId: ORG, tsas: counting, now: NOW, serverTimestamp: () => 'ts', send: false });
  assert.equal(r.status, 'dry-run');
  assert.match(r.imprint, /^[0-9a-f]{64}$/);
  assert.equal(sent, 0);
});

test('checkAnchors: an anchor must match a stored block exactly', async () => {
  const db = await chain(2);
  await anchorHead(db, { orgId: ORG, tsas: TSAS, now: NOW, serverTimestamp: () => 'ts' });
  const { events } = await readEvidenceChain(db, ORG);
  const anchors = [...db.docs.entries()].filter(([k]) => k.startsWith('orbit_evidence_anchors/')).map(([, v]) => v);
  const ok = checkAnchors(anchors, events);
  assert.equal(ok.ok, true);
  assert.equal(ok.anchors[0].blockIndex, 2);
  assert.deepEqual(ok.anchors[0].tsas.map((t) => t.id).sort(), ['digicert', 'sectigo']);
  const rewritten = events.map((e) => (e.blockIndex === 2 ? { ...e, eventHash: '0'.repeat(64) } : e));
  assert.equal(checkAnchors(anchors, rewritten).ok, false);
  assert.equal(checkAnchors(anchors, events.slice(0, 1)).ok, false);
  assert.equal(checkAnchors([{ ...anchors[0], imprint: '1'.repeat(64) }], events).ok, false);
});

test('firestore.rules: anchors are server-only', () => {
  const rules = readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8');
  assert.match(rules, /match \/orbit_evidence_anchors\/\{\w+\} \{\s*allow read, write: if false;\s*\}/);
});

test('a stored token re-verifies from the imprint alone; a different imprint does not', async () => {
  const { verifyStoredToken } = await import('../../scripts/orbit/anchor.mjs');
  const imprint = anchorImprint({ orgId: ORG, blockIndex: 1, eventHash: 'c'.repeat(64) });
  const replyDer = await digicert.post(makeQuery(imprint));
  assert.equal(verifyStoredToken({ imprint, replyDer, caFile: digicert.caFile, vendor: 'DigiCert' }).ok, true);
  assert.equal(verifyStoredToken({ imprint: '0'.repeat(64), replyDer, caFile: digicert.caFile, vendor: 'DigiCert' }).ok, false);
  assert.equal(verifyStoredToken({ imprint, replyDer, caFile: digicert.caFile, vendor: 'Sectigo' }).ok, false);
});

test('httpPost: sends the DER query with the RFC 3161 content type, refuses a non-2xx reply', async () => {
  const { httpPost } = await import('../../scripts/orbit/anchor.mjs');
  let seen;
  const fake = async (url, init) => { seen = { url, init }; return { ok: true, status: 200, arrayBuffer: async () => new Uint8Array([1, 2]).buffer }; };
  const out = await httpPost('http://tsa.example', fake)(Buffer.from([9]));
  assert.equal(seen.init.headers['Content-Type'], 'application/timestamp-query');
  assert.deepEqual([...out], [1, 2]);
  await assert.rejects(httpPost('http://tsa.example', async () => ({ ok: false, status: 503 }))(Buffer.from([9])), /HTTP 503/);
});
