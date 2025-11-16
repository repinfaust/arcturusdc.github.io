/**
 * Orbit Signature Utilities
 * PoC: HMAC-SHA256 signatures for event tamper-evidence
 */

import crypto from 'crypto';

/**
 * Create a canonical JSON representation of an event payload
 * (sorted keys, deterministic serialization)
 */
function canonicalizeEvent(event) {
  // Remove signature and signingKeyId for signing
  const { signature, signingKeyId, ...payload } = event;
  
  // Sort keys and stringify deterministically
  return JSON.stringify(payload, Object.keys(payload).sort());
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

