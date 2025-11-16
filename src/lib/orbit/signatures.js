/**
 * Orbit Signature Utilities
 * PoC: HMAC-SHA256 signatures for event tamper-evidence
 */

import crypto from 'crypto';

/**
 * Clean an event object by removing non-serializable fields
 * (Firestore Timestamps, etc.) that shouldn't be part of signature verification
 */
function cleanEventForSigning(event) {
  // Exclude fields that shouldn't be part of the hash/signature
  // Note: eventHash is excluded because it's computed FROM the event, not part of it
  // Note: previousEventHash and blockIndex are excluded because they're added AFTER signing
  //       (they're part of the hash chain, not the event payload being signed)
  const { signature, signingKeyId, timestamp, id, eventHash, previousEventHash, blockIndex, ...payload } = event;
  
  // Clean up any non-serializable values (like Firestore Timestamps)
  const cleanPayload = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value === null || value === undefined) {
      continue;
    }
    // Skip Firestore Timestamp objects (both native and serialized)
    if (typeof value === 'object' && value.constructor && value.constructor.name === 'Timestamp') {
      continue;
    }
    // Skip serialized Timestamp objects (from JSON.stringify of Firestore Timestamps)
    if (typeof value === 'object' && value._seconds !== undefined && value._nanoseconds !== undefined) {
      continue;
    }
    // Skip arrays that might contain Timestamps
    if (Array.isArray(value)) {
      const cleanedArray = value.filter(item => {
        if (typeof item === 'object' && item !== null) {
          if (item.constructor && item.constructor.name === 'Timestamp') {
            return false;
          }
          if (item._seconds !== undefined && item._nanoseconds !== undefined) {
            return false;
          }
        }
        return true;
      });
      if (cleanedArray.length > 0) {
        cleanPayload[key] = cleanedArray;
      }
      continue;
    }
    cleanPayload[key] = value;
  }
  
  return cleanPayload;
}

/**
 * Create a canonical JSON representation of an event payload
 * (sorted keys, deterministic serialization)
 */
function canonicalizeEvent(event) {
  const cleanPayload = cleanEventForSigning(event);
  // Sort keys and stringify deterministically
  return JSON.stringify(cleanPayload, Object.keys(cleanPayload).sort());
}

/**
 * Compute HMAC-SHA256 signature for an event
 * @param {Object} event - Event payload (without signature/signingKeyId)
 * @param {string} signingSecret - HMAC secret key
 * @returns {string} Hex-encoded signature
 */
export function signEvent(event, signingSecret) {
  const canonical = canonicalizeEvent(event);
  const hmac = crypto.createHmac('sha256', signingSecret);
  hmac.update(canonical);
  return hmac.digest('hex');
}

/**
 * Verify an event signature
 * @param {Object} event - Event with signature
 * @param {string} signingSecret - HMAC secret key
 * @returns {boolean} True if signature is valid
 */
export function verifyEventSignature(event, signingSecret) {
  if (!event.signature) {
    return false;
  }
  
  const expectedSignature = signEvent(event, signingSecret);
  return crypto.timingSafeEqual(
    Buffer.from(event.signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

/**
 * Compute SHA-256 hash of snapshot data
 * @param {Object} snapshotData - Snapshot data object
 * @returns {string} Hex-encoded hash
 */
export function hashSnapshot(snapshotData) {
  const canonical = JSON.stringify(snapshotData, Object.keys(snapshotData).sort());
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

/**
 * Verify snapshot integrity
 * @param {Object} snapshotData - Current snapshot data
 * @param {string} expectedHash - Hash from ledger event
 * @returns {boolean} True if hash matches
 */
export function verifySnapshotHash(snapshotData, expectedHash) {
  const computedHash = hashSnapshot(snapshotData);
  return crypto.timingSafeEqual(
    Buffer.from(computedHash, 'hex'),
    Buffer.from(expectedHash, 'hex')
  );
}

/**
 * Compute SHA-256 hash of an event (for hash chain linking)
 * @param {Object} event - Event object
 * @returns {string} Hex-encoded hash
 */
export function hashEvent(event) {
  // Create a clean copy for hashing (exclude Firestore-specific fields)
  const { timestamp, ...eventForHashing } = event;
  
  // Hash the canonical representation including signature
  const canonical = canonicalizeEvent(eventForHashing);
  const withSignature = canonical + (event.signature || '');
  return crypto.createHash('sha256').update(withSignature).digest('hex');
}

