// The generic control and evaluation event family (D-SITE-053). Strict: typed fields, no free
// text, unknown fields refused. The legacy consent types and validateEvent are unchanged.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EVIDENCE_EVENT_TYPES, EVIDENCE_FAMILIES, validateEvidenceEvent, generateEvidenceEventId,
  EVENT_TYPES, validateEvent,
} from '../../src/lib/orbit/eventTypes.js';

const H12 = '8b0aafe284d0';
const H64 = 'f3fc8e9bb7670763948ad1308f656df54e3d241c103fd30cd3dbf2c4a9eae390';
const base = { orgId: 'evidence-org', eventId: 'ev_0001', system: 'sys-a', occurredAt: '2026-10-26', chainVersion: 2 };
const VALID = {
  CONTROL_TRIGGERED: { version: 'v1.0', controlId: 'gate-1', policyHash: H64 },
  CONTROL_OVERRIDDEN: { version: 'v1.0', controlId: 'gate-1', policyHash: H64 },
  ESCALATION_REQUESTED: { version: 'v1.0', controlId: 'gate-1', policyHash: H64 },
  HUMAN_REVIEW_REQUESTED: { version: 'v1.0', controlId: 'gate-1', policyHash: H64 },
  HUMAN_REVIEW_COMPLETED: { version: 'v1.0', controlId: 'gate-1', policyHash: H64, subjectEventId: 'ev_0002' },
  EVALUATION_RUN: { version: 'lab-1.0', commit: '6881375', modelSnapshots: ['model-a-20251001'], metrics: { rows: 693, misses: 0 }, decisionId: 'D-L031' },
  RUBRIC_VERSIONED: { rubricHash: H12, commit: '2e088d8', decisionId: 'D-075', previousRubricHash: '84e80788c7ea' },
  PREREGISTRATION_FROZEN: { preregHash: H64, commit: '13b7d70', decisionId: 'D-L022', metrics: { prereg_version: 4 } },
  HUMAN_AUDIT_COMPLETED: { commit: 'c08bfe1', decisionId: 'D-L031', metrics: { disagreements: 9, max_allowed: 6 } },
  REGRESSION_DETECTED: { decisionId: 'D-100', metrics: { delta: -0.5 }, subjectEventId: 'ev_0003' },
  CLAIM_WITHDRAWN: { decisionId: 'D-077', commit: '2e088d8', subjectEventId: 'ev_0004' },
};
const ev = (type, extra = {}) => ({ ...base, eventType: type, ...VALID[type], ...extra });
const bad = (e, re) => {
  const r = validateEvidenceEvent(e);
  assert.equal(r.valid, false, `expected refusal: ${JSON.stringify(e)}`);
  if (re) assert.match(r.errors.join(' | '), re);
};

test('eleven types: the nine from the direction note, HUMAN_REVIEW_COMPLETED and PREREGISTRATION_FROZEN', () => {
  assert.deepEqual(Object.keys(EVIDENCE_EVENT_TYPES).sort(), Object.keys(VALID).sort());
  assert.deepEqual(EVIDENCE_FAMILIES.control.sort(), ['CONTROL_OVERRIDDEN', 'CONTROL_TRIGGERED', 'ESCALATION_REQUESTED', 'HUMAN_REVIEW_COMPLETED', 'HUMAN_REVIEW_REQUESTED']);
  assert.deepEqual(EVIDENCE_FAMILIES.evaluation.sort(), ['CLAIM_WITHDRAWN', 'EVALUATION_RUN', 'HUMAN_AUDIT_COMPLETED', 'PREREGISTRATION_FROZEN', 'REGRESSION_DETECTED', 'RUBRIC_VERSIONED']);
});

for (const type of Object.keys(VALID)) {
  test(`${type}: a valid event passes`, () => {
    const r = validateEvidenceEvent(ev(type));
    assert.deepEqual(r, { valid: true, errors: [] });
  });
  test(`${type}: each required field is required`, () => {
    for (const f of Object.keys({ ...base, ...VALID[type] })) {
      if (['previousRubricHash'].includes(f)) continue; // optional
      const e = ev(type);
      delete e[f];
      bad(e, new RegExp(f));
    }
  });
}

test('a zero metric is a value, not a missing field (the presence-check bug)', () => {
  assert.equal(validateEvidenceEvent(ev('EVALUATION_RUN', { metrics: { misses: 0 } })).valid, true);
});

test('unknown fields are refused, top level and anywhere nested', () => {
  bad(ev('EVALUATION_RUN', { note: 'x' }), /unknown field: note/);
  bad(ev('EVALUATION_RUN', { userId: 'u1' }), /unknown field: userId/);
});

test('no free text: whitespace and over-long values are refused in every string field', () => {
  bad(ev('EVALUATION_RUN', { system: 'two words' }), /system/);
  bad(ev('EVALUATION_RUN', { version: 'a'.repeat(65) }), /version/);
  bad(ev('EVALUATION_RUN', { decisionId: 'the filter beats the lexicon' }), /decisionId/);
  bad(ev('EVALUATION_RUN', { commit: 'not a commit' }), /commit/);
  bad(ev('EVALUATION_RUN', { modelSnapshots: ['ok-model', 'has space'] }), /modelSnapshots/);
  bad(ev('CONTROL_TRIGGERED', { controlId: 'line\nbreak' }), /controlId/);
  bad(ev('RUBRIC_VERSIONED', { rubricHash: 'XYZ' }), /rubricHash/);
  bad(ev('EVALUATION_RUN', { occurredAt: 'last Tuesday' }), /occurredAt/);
});

test('metrics: finite numbers only, identifier keys, at most 64', () => {
  bad(ev('EVALUATION_RUN', { metrics: { rows: '693' } }), /metrics\.rows/);
  bad(ev('EVALUATION_RUN', { metrics: { rows: NaN } }), /metrics\.rows/);
  bad(ev('EVALUATION_RUN', { metrics: { rows: Infinity } }), /metrics\.rows/);
  bad(ev('EVALUATION_RUN', { metrics: { rows: true } }), /metrics\.rows/);
  bad(ev('EVALUATION_RUN', { metrics: { 'Bad Key': 1 } }), /metrics/);
  bad(ev('EVALUATION_RUN', { metrics: { nested: { a: 1 } } }), /metrics\.nested/);
  bad(ev('EVALUATION_RUN', { metrics: Object.fromEntries(Array.from({ length: 65 }, (_, i) => [`m${i}`, i])) }), /metrics/);
  bad(ev('EVALUATION_RUN', { metrics: [1, 2] }), /metrics/);
});

test('arrays: typed and capped', () => {
  bad(ev('EVALUATION_RUN', { modelSnapshots: 'model-a' }), /modelSnapshots/);
  bad(ev('EVALUATION_RUN', { modelSnapshots: Array.from({ length: 17 }, (_, i) => `m${i}`) }), /modelSnapshots/);
  bad(ev('EVALUATION_RUN', { relatedDecisionIds: ['D-001', 'not an id'] }), /relatedDecisionIds/);
});

test('nested objects are refused everywhere except metrics', () => {
  bad(ev('EVALUATION_RUN', { system: { name: 'x' } }), /system/);
  bad(ev('EVALUATION_RUN', { commit: ['6881375'] }), /commit/);
});

test('type-specific rules', () => {
  bad(ev('PREREGISTRATION_FROZEN', { metrics: { other: 1 } }), /prereg_version/);
  bad(ev('CLAIM_WITHDRAWN', { subjectEventId: undefined }), /withdrawsEventId or subjectEventId/);
  assert.equal(validateEvidenceEvent(ev('CLAIM_WITHDRAWN', { subjectEventId: undefined, withdrawsEventId: 'ev_9' })).valid, true);
  bad(ev('EVALUATION_RUN', { chainVersion: 1 }), /chainVersion/);
  bad(ev('EVALUATION_RUN', { backfilled: 'yes' }), /backfilled/);
  bad({ ...ev('EVALUATION_RUN'), eventType: 'CONSENT_GRANTED' }, /eventType/);
  bad(null, /object/);
});

test('generateEvidenceEventId: random and schema-valid', () => {
  const a = generateEvidenceEventId();
  assert.notEqual(a, generateEvidenceEventId());
  assert.equal(validateEvidenceEvent(ev('EVALUATION_RUN', { eventId: a })).valid, true);
});

test('legacy consent family is untouched', () => {
  assert.equal(Object.keys(EVENT_TYPES).length, 8);
  assert.deepEqual(validateEvent({ eventType: 'CONSENT_GRANTED', userId: 'u', orgId: 'o', consentScope: 's', consentStatus: 'GRANTED' }), { valid: true });
  assert.equal(validateEvent({ eventType: 'CONSENT_GRANTED', userId: 'u', orgId: 'o', consentScope: 's' }).valid, false);
  assert.equal(validateEvent({ eventType: 'EVALUATION_RUN' }).valid, false); // the new family never enters the legacy path
});
