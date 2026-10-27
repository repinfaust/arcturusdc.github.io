// The evidence backfill's pure core (D-SITE-057): every commit, hash and machine-checkable
// number is verified against the source repositories before anything is written.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildEvidencePayloads, deterministicEventId, planBackfill } from '../../scripts/orbit/backfillCore.mjs';

const H = (c) => c.repeat(64);
const fakeRepos = {
  'repo-a': {
    commits: new Set(['aaaaaaa', 'bbbbbbb']),
    files: { 'aaaaaaa:rubric.md': H('1'), 'bbbbbbb:out.json': H('2') },
    json: { 'bbbbbbb:out.json': { audit: { disagreements: 9, ok: true }, rows: [1, 2, 3] } },
  },
};
const verifier = {
  commitExists: (repo, c) => fakeRepos[repo]?.commits.has(c) ?? false,
  fileSha256: (repo, at, path) => fakeRepos[repo]?.files[`${at}:${path}`] ?? null,
  readJson: (repo, at, path) => fakeRepos[repo]?.json[`${at}:${path}`] ?? null,
};
const sources = () => ({
  version: 1,
  orgId: 'evidence-org',
  events: [
    {
      key: 'rubric-1', repo: 'repo-a',
      payload: { eventType: 'RUBRIC_VERSIONED', system: 'sys-a', decisionId: 'D-034', commit: 'aaaaaaa', occurredAt: '2026-08-03', rubricHash: H('1').slice(0, 12) },
      verify: [{ field: 'rubricHash', kind: 'sha256-12', path: 'rubric.md', at: 'aaaaaaa' }],
    },
    {
      key: 'audit-1', repo: 'repo-a',
      payload: { eventType: 'HUMAN_AUDIT_COMPLETED', system: 'sys-a', decisionId: 'D-L031', commit: 'bbbbbbb', occurredAt: '2026-10-26', artifactHash: H('2'), metrics: { disagreements: 9, ok: 1, n: 3 } },
      links: { subjectEventId: 'rubric-1' },
      verify: [
        { field: 'artifactHash', kind: 'sha256', path: 'out.json', at: 'bbbbbbb' },
        { field: 'metrics.disagreements', kind: 'json', path: 'out.json', at: 'bbbbbbb', pointer: '/audit/disagreements' },
        { field: 'metrics.ok', kind: 'json', path: 'out.json', at: 'bbbbbbb', pointer: '/audit/ok' },
        { field: 'metrics.n', kind: 'json-length', path: 'out.json', at: 'bbbbbbb', pointer: '/rows' },
      ],
    },
  ],
});

test('deterministicEventId: stable, schema-shaped, distinct per source key', () => {
  const a = deterministicEventId('evidence-org', 'rubric-1');
  assert.equal(a, deterministicEventId('evidence-org', 'rubric-1'));
  assert.notEqual(a, deterministicEventId('evidence-org', 'audit-1'));
  assert.match(a, /^ev_[0-9a-f]{24}$/);
});

test('build: verified payloads, links resolved to earlier events, orgId and chain fields set', () => {
  const { payloads, checks } = buildEvidencePayloads(sources(), verifier);
  assert.equal(payloads.length, 2);
  assert.equal(payloads[1].subjectEventId, payloads[0].eventId);
  for (const p of payloads) {
    assert.equal(p.orgId, 'evidence-org');
    assert.equal(p.chainVersion, 2);
    assert.equal(p.backfilled, true);
  }
  assert.equal(checks.filter((c) => c.ok).length, checks.length);
  assert.ok(checks.length >= 7); // 2 commits + 5 field checks
});

test('build refuses, naming every failure: missing commit, wrong hash, wrong number, forward link', () => {
  const s = sources();
  s.events[0].payload.commit = 'ccccccc';
  s.events[1].payload.artifactHash = H('9');
  s.events[1].payload.metrics.disagreements = 8;
  s.events[1].payload.metrics.n = 4;
  s.events[0].links = { subjectEventId: 'audit-1' };
  assert.throws(() => buildEvidencePayloads(s, verifier), (e) => {
    for (const re of [/rubric-1: commit ccccccc not found/, /audit-1: artifactHash/, /audit-1: metrics\.disagreements/, /audit-1: metrics\.n/, /rubric-1: link subjectEventId -> audit-1 is not an earlier event/]) {
      assert.match(e.message, re);
    }
    return true;
  });
});

test('build refuses a payload the schema refuses, and duplicate keys', () => {
  const s = sources();
  s.events[0].payload.note = 'free text';
  assert.throws(() => buildEvidencePayloads(s, verifier), /rubric-1: unknown field: note/);
  const d = sources();
  d.events[1].key = 'rubric-1';
  assert.throws(() => buildEvidencePayloads(d, verifier), /duplicate key rubric-1/);
});

test('build refuses chain fields or ids set by hand in the sources', () => {
  const s = sources();
  s.events[0].payload.eventId = 'ev_hand_made';
  assert.throws(() => buildEvidencePayloads(s, verifier), /rubric-1: eventId/);
});

test('plan: empty chain writes all; a matching prefix needs --append; anything else refuses', () => {
  const { payloads } = buildEvidencePayloads(sources(), verifier);
  assert.deepEqual(planBackfill(payloads, [], { append: false }).toWrite.length, 2);
  const prefix = [{ eventId: payloads[0].eventId }];
  assert.throws(() => planBackfill(payloads, prefix, { append: false }), /already holds 1/);
  assert.equal(planBackfill(payloads, prefix, { append: true }).toWrite.length, 1);
  assert.equal(planBackfill(payloads, payloads, { append: true }).toWrite.length, 0);
  assert.throws(() => planBackfill(payloads, [{ eventId: 'ev_other' }], { append: true }), /does not match/);
});

// ---- A3 results files (D-SITE-062) ----
const A3 = {
  present: true,
  prereg: { arms: { bare: { k58: 20, k78: 37 } }, rows: 693, errors: 0 },
  rejudged: { arms: { bare: { k58: 25 } }, rows: 693, verdicts_changed: 209 },
};
const a3Sources = () => ({
  version: 1,
  orgId: 'evidence-org',
  events: [{
    key: 'a3-run', repo: 'repo-a',
    payload: { eventType: 'EVALUATION_RUN', system: 'sys-a', version: 'v0.1', decisionId: 'D-062', commit: 'aaaaaaa', occurredAt: '2026-08-08', modelSnapshots: [],
      metrics: { rows: 693, errors: 0, sens58_bare_k: 20, sens78_bare_k: 37, rejudged_sens58_bare_k: 25, verdicts_changed: 209 } },
    verify: [
      { field: 'metrics.rows', kind: 'a3', file: 'prereg', value: 'rows' },
      { field: 'metrics.errors', kind: 'a3', file: 'prereg', value: 'errors' },
      { field: 'metrics.sens58_bare_k', kind: 'a3', file: 'prereg', value: 'arms.bare.k58' },
      { field: 'metrics.sens78_bare_k', kind: 'a3', file: 'prereg', value: 'arms.bare.k78' },
      { field: 'metrics.rejudged_sens58_bare_k', kind: 'a3', file: 'rejudged', value: 'arms.bare.k58' },
      { field: 'metrics.verdicts_changed', kind: 'a3', file: 'rejudged', value: 'verdicts_changed' },
    ],
  }],
});
const withA3 = (a3) => ({ ...verifier, a3Results: () => a3 });

test('A3 checks: present files must match every figure', () => {
  const { checks } = buildEvidencePayloads(a3Sources(), withA3(A3));
  assert.equal(checks.filter((c) => c.kind === 'a3' && c.ok === true).length, 6);
});

test('A3 checks: a mismatch refuses the run, naming the field', () => {
  const s = a3Sources();
  s.events[0].payload.metrics.verdicts_changed = 208;
  assert.throws(() => buildEvidencePayloads(s, withA3(A3)), /a3-run: metrics\.verdicts_changed does not match a3 rejudged\.verdicts_changed/);
});

test('A3 checks: absent files are skipped and reported, not passed', () => {
  const { checks } = buildEvidencePayloads(a3Sources(), withA3({ present: false }));
  const a3 = checks.filter((c) => c.kind === 'a3');
  assert.equal(a3.length, 6);
  assert.ok(a3.every((c) => c.ok === null && /not present/.test(c.note)));
});

test('A3 checks: a refusal from the recompute refuses the run', () => {
  assert.throws(() => buildEvidencePayloads(a3Sources(), withA3({ error: 'oq25_recompute refused: run_identity differs' })), /a3-run: A3 results refused: oq25_recompute refused/);
});
