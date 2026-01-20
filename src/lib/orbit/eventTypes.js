/**
 * Orbit Event Types and Schema Validation
 */

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

