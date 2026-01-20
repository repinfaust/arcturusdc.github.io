/**
 * Orbit Policy Engine
 * Detects undeclared events and policy violations
 */

import { getUserEvents, getConsentState, getOrg, getSnapshot, createAlert } from './db-admin';
import { verifySnapshotHash } from './signatures';

/**
 * Check event for policy violations
 */
export async function checkEventPolicies(event) {
  const violations = [];

  // Check usage without consent
  if (event.eventType === 'DATA_USED' || event.eventType === 'DATA_SHARED') {
    const consentStates = await getConsentState(event.userId, event.orgId);
    const requiredScopes = Array.isArray(event.scopes) ? event.scopes : [event.scopes];
    
    for (const scope of requiredScopes) {
      const consent = consentStates.find(c => c.scope === scope && c.status === 'GRANTED');
      if (!consent) {
        violations.push({
          type: 'NO_CONSENT',
          scope,
          message: `Data used/shared without consent for scope: ${scope}`,
        });
      }
    }
  }

  // Check shared to unknown recipient
  if (event.eventType === 'DATA_SHARED' && event.recipientOrgId) {
    const recipient = await getOrg(event.recipientOrgId);
    if (!recipient) {
      violations.push({
        type: 'UNKNOWN_RECIPIENT',
        recipientOrgId: event.recipientOrgId,
        message: `Data shared to unknown organisation: ${event.recipientOrgId}`,
      });
    }
  }

  // Check snapshot hash integrity
  if (event.snapshotPointer && event.snapshotHash) {
    const snapshot = await getSnapshot(event.snapshotPointer);
    if (snapshot) {
      const isValid = verifySnapshotHash(snapshot.data, event.snapshotHash);
      if (!isValid) {
        violations.push({
          type: 'HASH_MISMATCH',
          snapshotPointer: event.snapshotPointer,
          message: 'Snapshot hash mismatch - possible tampering',
        });
      }
    }
  }

  // Create alerts for violations
  for (const violation of violations) {
    await createAlert({
      alertType: violation.type,
      userId: event.userId,
      orgId: event.orgId,
      eventId: event.eventId,
      message: violation.message,
      metadata: violation,
    });
  }

  return violations;
}

/**
 * Check for suspicious volume patterns
 */
export async function checkVolumePatterns(userId, orgId, windowHours = 24, threshold = 100) {
  const events = await getUserEvents(userId, { orgId, eventType: 'DATA_USED' });
  
  const now = Date.now();
  const windowMs = windowHours * 60 * 60 * 1000;
  const recentEvents = events.filter(e => {
    const eventTime = e.timestamp?.toMillis?.() || e.timestamp;
    return now - eventTime < windowMs;
  });

  if (recentEvents.length > threshold) {
    await createAlert({
      alertType: 'ANOMALOUS_VOLUME',
      userId,
      orgId,
      message: `Unusual volume: ${recentEvents.length} DATA_USED events in ${windowHours}h`,
      metadata: { count: recentEvents.length, windowHours },
    });
  }
}

