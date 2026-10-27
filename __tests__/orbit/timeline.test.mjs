// The evidence timeline (D-SITE-059): owner only, read-only, re-checked server-side.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildTimeline, loadTimeline, EVIDENCE_ORG_ID } from '../../src/lib/orbit/evidenceTimeline.js';
import { sessionFromCookie } from '../../src/lib/orbit/serverSession.js';
import { linkEventV2 } from '../../src/lib/orbit/chainV2.js';

const OWNER = { authenticated: true, user: { uid: 'u1', email: 'repinfaust@gmail.com', emailVerified: true } };
const OTHER = { authenticated: true, user: { uid: 'u2', email: 'someone@example.test', emailVerified: true } };
const ROOT = new URL('../../', import.meta.url);

function chain() {
  const a = linkEventV2({ eventType: 'RUBRIC_VERSIONED', orgId: EVIDENCE_ORG_ID, eventId: 'ev_aaa', system: 'sys-a', rubricHash: '84e80788c7ea', commit: '778550f', decisionId: 'D-034', occurredAt: '2026-08-03', chainVersion: 2, backfilled: true }, null, 's', 'k');
  const b = linkEventV2({ eventType: 'CLAIM_WITHDRAWN', orgId: EVIDENCE_ORG_ID, eventId: 'ev_bbb', system: 'sys-a', commit: '2e088d8', decisionId: 'D-077', relatedDecisionIds: ['D-076'], occurredAt: '2026-08-09', chainVersion: 2, subjectEventId: 'ev_aaa', metrics: { z_last: 2, a_first: 1 } }, { blockIndex: 1, eventHash: a.eventHash }, 's', 'k');
  return [{ ...a, recordedAt: { _seconds: 1, toDate() {} } }, b];
}

test('buildTimeline: plain, serialisable rows; links point at block numbers; bookkeeping dropped', () => {
  const rows = buildTimeline(chain());
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[1].links, [{ field: 'subjectEventId', eventId: 'ev_aaa', blockIndex: 1 }]);
  assert.deepEqual(rows[1].metrics, [['a_first', 1], ['z_last', 2]]);
  assert.deepEqual(rows[0].hashes, [['rubricHash', '84e80788c7ea']]);
  assert.equal(rows[0].family, 'evaluation');
  assert.equal(rows[0].backfilled, true);
  assert.equal(JSON.parse(JSON.stringify(rows)).length, 2);
  assert.ok(!('recordedAt' in rows[0]) && !('signature' in rows[0]));
});

test('loadTimeline: owner only; nothing is read for anyone else', async () => {
  let reads = 0;
  const readChain = async () => { reads++; return { events: chain(), head: { blockIndex: 2, eventHash: 'h', updatedAt: { toDate() {} } } }; };
  assert.equal((await loadTimeline({ session: OTHER, readChain })).status, 'forbidden');
  assert.equal((await loadTimeline({ session: { authenticated: false }, readChain })).status, 'forbidden');
  assert.equal(reads, 0);
  const ok = await loadTimeline({ session: OWNER, readChain });
  assert.equal(ok.status, 'ok');
  assert.deepEqual(ok.head, { blockIndex: 2, eventHash: 'h' });
  assert.equal(ok.rows.length, 2);
});

test('sessionFromCookie: no cookie, a bad cookie and a good one', async () => {
  const auth = { verifySessionCookie: async (c, revoked) => {
    assert.equal(revoked, true);
    if (c !== 'good') throw new Error('bad');
    return { uid: 'u1', email: 'repinfaust@gmail.com', email_verified: true };
  } };
  assert.equal((await sessionFromCookie(undefined, auth)).authenticated, false);
  assert.equal((await sessionFromCookie('bad', auth)).authenticated, false);
  assert.deepEqual(await sessionFromCookie('good', auth), { authenticated: true, user: { uid: 'u1', email: 'repinfaust@gmail.com', emailVerified: true } });
});

// Inert until D-SITE-061 is fixed: Next ignores the root middleware.js. The page check below is the real gate.
test('middleware protects the route and limits it to the owner', () => {
  const mw = readFileSync(new URL('middleware.js', ROOT), 'utf8');
  for (const p of ['/apps/stea/orbit/evidence', '/stea/orbit/evidence']) assert.ok(mw.includes(`'${p}'`), p);
  assert.match(mw, /isOrbitEvidenceRoute/);
});

test('the page re-checks server-side and shows nothing but a 404 to anyone else', () => {
  const page = readFileSync(new URL('src/app/apps/stea/orbit/evidence/page.js', ROOT), 'utf8');
  assert.match(page, /loadTimeline\(/);
  assert.match(page, /notFound\(\)/);
  assert.match(page, /force-dynamic/);
  assert.match(page, /index: false/);
});

test('the verification line is scoped and says "verified by Orbit, not independently"', () => {
  const ui = readFileSync(new URL('src/app/apps/stea/orbit/evidence/EvidenceTimeline.js', ROOT), 'utf8');
  assert.match(ui, /verified by Orbit, not independently/i);
  assert.match(ui, /verifiedAt/);
});

test('loadTimeline: anchors come through sorted, with downloadable tokens; none for others', async () => {
  const { buildAnchors } = await import('../../src/lib/orbit/evidenceTimeline.js');
  const anchors = [
    { blockIndex: 5, eventHash: 'b', imprint: 'i5', tokens: { sectigo: { url: 's', genTime: 't2', replyDer: 'QQ==' }, digicert: { url: 'd', genTime: 't1', replyDer: 'QQ==' } } },
    { blockIndex: 2, eventHash: 'a', imprint: 'i2', tokens: { digicert: { url: 'd', genTime: 't0', replyDer: 'QQ==' } } },
  ];
  const out = buildAnchors(anchors);
  assert.deepEqual(out.map((a) => a.blockIndex), [2, 5]);
  assert.deepEqual(out[1].tokens.map((t) => t.id), ['digicert', 'sectigo']);
  let read = false;
  await loadTimeline({ session: OTHER, readChain: async () => ({ events: [], head: null }), readAnchors: async () => { read = true; return anchors; } });
  assert.equal(read, false);
});

test('the page says which blocks are anchored and that later ones are verified by Orbit only', () => {
  const ui = readFileSync(new URL('src/app/apps/stea/orbit/evidence/EvidenceTimeline.js', ROOT), 'utf8');
  assert.match(ui, /time-stamped by DigiCert and Sectigo/);
  assert.match(ui, /verified by Orbit, not independently, until the next anchor/);
  assert.match(ui, /Not yet anchored: the chain is verified by Orbit, not independently/);
  assert.match(ui, /openssl ts -verify -digest/);
});
