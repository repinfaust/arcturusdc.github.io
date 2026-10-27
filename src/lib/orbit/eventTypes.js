/**
 * Orbit Event Types and Schema Validation
 */

import crypto from 'crypto';

export const EVENT_TYPES = {
  PROFILE_REGISTERED: 'PROFILE_REGISTERED',
  PROFILE_UPDATED: 'PROFILE_UPDATED',
  CONSENT_GRANTED: 'CONSENT_GRANTED',
  CONSENT_REVOKED: 'CONSENT_REVOKED',
  DATA_USED: 'DATA_USED',
  DATA_SHARED: 'DATA_SHARED',
  VERIFICATION_REQUESTED: 'VERIFICATION_REQUESTED',
  VERIFICATION_RESPONDED: 'VERIFICATION_RESPONDED',
};

/**
 * Required fields per event type
 */
export const EVENT_SCHEMA = {
  [EVENT_TYPES.PROFILE_REGISTERED]: {
    required: ['userId', 'orgId', 'snapshotPointer', 'snapshotHash', 'scopes'],
  },
  [EVENT_TYPES.PROFILE_UPDATED]: {
    required: ['userId', 'orgId', 'snapshotPointer', 'snapshotHash', 'scopes'],
  },
  [EVENT_TYPES.CONSENT_GRANTED]: {
    required: ['userId', 'orgId', 'consentScope', 'consentStatus'],
  },
  [EVENT_TYPES.CONSENT_REVOKED]: {
    required: ['userId', 'orgId', 'consentScope', 'consentStatus'],
  },
  [EVENT_TYPES.DATA_USED]: {
    required: ['userId', 'orgId', 'scopes', 'purpose'],
  },
  [EVENT_TYPES.DATA_SHARED]: {
    required: ['userId', 'orgId', 'recipientOrgId', 'scopes'],
  },
  [EVENT_TYPES.VERIFICATION_REQUESTED]: {
    required: ['userId', 'orgId', 'recipientOrgId', 'verificationClaim'],
  },
  [EVENT_TYPES.VERIFICATION_RESPONDED]: {
    required: ['userId', 'orgId', 'recipientOrgId', 'verificationClaim', 'verificationResult'],
  },
};

/**
 * Validate event against schema
 */
export function validateEvent(event) {
  const schema = EVENT_SCHEMA[event.eventType];
  if (!schema) {
    return { valid: false, error: `Unknown event type: ${event.eventType}` };
  }

  const missing = schema.required.filter(field => !event[field]);
  if (missing.length > 0) {
    return { valid: false, error: `Missing required fields: ${missing.join(', ')}` };
  }

  return { valid: true };
}

/**
 * Generate event ID
 */
export function generateEventId() {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}


/* ==========================================================
   Generic control and evaluation events (D-SITE-053)
   From the 9 Aug 2026 direction note, plus HUMAN_REVIEW_COMPLETED (paired with
   HUMAN_REVIEW_REQUESTED) and PREREGISTRATION_FROZEN (an addition to the note).
   Strict, unlike validateEvent above: every field is typed, unknown fields are refused, and no
   string field accepts whitespace, so free text can't be stored. Nothing here is domain-specific;
   metric names are identifiers chosen by the source.
   ========================================================== */

export const EVIDENCE_FAMILIES = {
  control: ['CONTROL_TRIGGERED', 'CONTROL_OVERRIDDEN', 'ESCALATION_REQUESTED', 'HUMAN_REVIEW_REQUESTED', 'HUMAN_REVIEW_COMPLETED'],
  evaluation: ['EVALUATION_RUN', 'RUBRIC_VERSIONED', 'HUMAN_AUDIT_COMPLETED', 'REGRESSION_DETECTED', 'CLAIM_WITHDRAWN', 'PREREGISTRATION_FROZEN'],
};

export const EVIDENCE_EVENT_TYPES = Object.fromEntries(
  [...EVIDENCE_FAMILIES.control, ...EVIDENCE_FAMILIES.evaluation].map((t) => [t, t])
);

const IDENT = /^[a-z0-9][a-z0-9._-]{0,63}$/;
const EVENT_ID = /^[a-z0-9][a-z0-9_-]{2,63}$/;
const DECISION_ID = /^[A-Z][A-Z0-9-]{1,23}$/;
const COMMIT = /^[0-9a-f]{7,40}$/;
const HASH = /^[0-9a-f]{12,64}$/;
const MODEL = /^[a-z0-9][a-z0-9.:-]{0,63}$/;
const METRIC_KEY = /^[a-z][a-z0-9_]{0,47}$/;
const OCCURRED_AT = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,6})?Z)?$/;
const MAX_METRICS = 64;
const MAX_LIST = 16;

const str = (re) => (v) => typeof v === 'string' && re.test(v);
const list = (re) => (v) => Array.isArray(v) && v.length <= MAX_LIST && v.every((x) => typeof x === 'string' && re.test(x));

// Field -> check. `metrics` is checked separately so each bad key is named.
const EVIDENCE_FIELDS = {
  eventType: (v) => Object.prototype.hasOwnProperty.call(EVIDENCE_EVENT_TYPES, v),
  orgId: str(EVENT_ID),
  eventId: str(EVENT_ID),
  system: str(IDENT),
  version: str(IDENT),
  decisionId: str(DECISION_ID),
  relatedDecisionIds: list(DECISION_ID),
  commit: str(COMMIT),
  policyHash: str(HASH),
  promptHash: str(HASH),
  rubricHash: str(HASH),
  previousRubricHash: str(HASH),
  preregHash: str(HASH),
  artifactHash: str(HASH),
  modelSnapshots: list(MODEL),
  metrics: null,
  controlId: str(IDENT),
  supersedesEventId: str(EVENT_ID),
  withdrawsEventId: str(EVENT_ID),
  subjectEventId: str(EVENT_ID),
  occurredAt: (v) => typeof v === 'string' && OCCURRED_AT.test(v) && !Number.isNaN(Date.parse(v)),
  backfilled: (v) => typeof v === 'boolean',
  chainVersion: (v) => v === 2,
};

const COMMON_REQUIRED = ['eventType', 'orgId', 'eventId', 'system', 'occurredAt', 'chainVersion'];
const CONTROL_REQUIRED = ['version', 'controlId', 'policyHash'];

export const EVIDENCE_SCHEMA = {
  CONTROL_TRIGGERED: CONTROL_REQUIRED,
  CONTROL_OVERRIDDEN: CONTROL_REQUIRED,
  ESCALATION_REQUESTED: CONTROL_REQUIRED,
  HUMAN_REVIEW_REQUESTED: CONTROL_REQUIRED,
  HUMAN_REVIEW_COMPLETED: [...CONTROL_REQUIRED, 'subjectEventId'],
  EVALUATION_RUN: ['version', 'commit', 'modelSnapshots', 'metrics', 'decisionId'],
  RUBRIC_VERSIONED: ['rubricHash', 'commit', 'decisionId'],
  PREREGISTRATION_FROZEN: ['preregHash', 'commit', 'decisionId', 'metrics'],
  HUMAN_AUDIT_COMPLETED: ['commit', 'decisionId', 'metrics'],
  REGRESSION_DETECTED: ['decisionId', 'metrics', 'subjectEventId'],
  CLAIM_WITHDRAWN: ['decisionId', 'commit'],
};

function metricErrors(metrics) {
  if (metrics === null || typeof metrics !== 'object' || Array.isArray(metrics)) {
    return ['metrics must be an object of finite numbers'];
  }
  const keys = Object.keys(metrics);
  const errors = keys.length > MAX_METRICS ? [`metrics has more than ${MAX_METRICS} keys`] : [];
  for (const k of keys) {
    if (!METRIC_KEY.test(k)) errors.push(`metrics key not an identifier: ${k}`);
    else if (typeof metrics[k] !== 'number' || !Number.isFinite(metrics[k])) errors.push(`metrics.${k} must be a finite number`);
  }
  return errors;
}

/**
 * Validate a control or evaluation event. Returns { valid, errors } and never throws.
 * Fields with value undefined count as absent.
 */
export function validateEvidenceEvent(event) {
  if (event === null || typeof event !== 'object' || Array.isArray(event)) {
    return { valid: false, errors: ['event must be an object'] };
  }
  const errors = [];
  const present = Object.keys(event).filter((k) => event[k] !== undefined);

  for (const k of present) {
    if (!Object.prototype.hasOwnProperty.call(EVIDENCE_FIELDS, k)) errors.push(`unknown field: ${k}`);
    else if (k === 'metrics') errors.push(...metricErrors(event.metrics));
    else if (!EVIDENCE_FIELDS[k](event[k])) errors.push(`invalid ${k}`);
  }

  const required = [...COMMON_REQUIRED, ...(EVIDENCE_SCHEMA[event.eventType] || [])];
  for (const k of required) {
    if (!present.includes(k)) errors.push(`missing ${k}`);
  }

  if (event.eventType === 'PREREGISTRATION_FROZEN' && event.metrics && !Number.isInteger(event.metrics.prereg_version)) {
    errors.push('PREREGISTRATION_FROZEN needs metrics.prereg_version as an integer');
  }
  if (event.eventType === 'CLAIM_WITHDRAWN' && !present.includes('withdrawsEventId') && !present.includes('subjectEventId')) {
    errors.push('CLAIM_WITHDRAWN needs withdrawsEventId or subjectEventId');
  }

  return { valid: errors.length === 0, errors };
}

export function generateEvidenceEventId() {
  return `ev_${crypto.randomUUID().replace(/-/g, '')}`;
}
