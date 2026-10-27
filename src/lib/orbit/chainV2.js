/**
 * Orbit chain v2 (D-SITE-054)
 *
 * Fixes the two v1 defects for new events only (planning/ORBIT_EVIDENCE_CHAIN_PLAN.md §0):
 *   F2: v1's canonical form (signatures.js:61-65) passes a key list as the JSON.stringify
 *       replacer, which also filters nested keys, so nested values went unsigned. v2 serialises
 *       recursively with sorted keys and refuses anything that isn't plain JSON.
 *   F1: v1's hashEvent strips previousEventHash and blockIndex (signatures.js:17), so the hash
 *       never committed to its predecessor. v2's hash covers the link.
 * v1 (signatures.js) is untouched; stored POC events keep verifying as before. Dispatch is on
 * the event's chainVersion, which is inside both the signature and the hash.
 *
 * Signature: HMAC-SHA256 over the payload and signingKeyId. Orbit holds the secret, so a
 *   signature shows the event is unchanged since Orbit signed it, if you trust Orbit.
 * Hash: SHA-256 over everything stored except eventHash and server bookkeeping, including the
 *   signature, previousEventHash and blockIndex.
 * Block 1 links to GENESIS_HASH, so the first event is linked and checked like any other.
 */

import crypto from 'crypto';
import { validateEvidenceEvent } from './eventTypes.js';

export const CHAIN_VERSION = 2;
export const GENESIS_HASH = '0'.repeat(64);
const CHAIN_FIELDS = ['signingKeyId', 'previousEventHash', 'blockIndex', 'signature', 'eventHash'];
const BOOKKEEPING = ['id', 'recordedAt']; // Firestore doc id and server write time: not part of the record
const NOT_SIGNED = new Set(['signature', 'eventHash', 'previousEventHash', 'blockIndex', ...BOOKKEEPING]);
const NOT_HASHED = new Set(['eventHash', ...BOOKKEEPING]);

function isPlainObject(v) {
  if (v === null || typeof v !== 'object') return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

/** Deterministic JSON: keys sorted at every depth. Throws on anything that isn't plain JSON. */
export function canonicalV2(value) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('canonicalV2: non-finite number');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalV2).join(',')}]`;
  if (isPlainObject(value)) {
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => {
      if (value[k] === undefined) throw new Error(`canonicalV2: undefined at ${k}`);
      return `${JSON.stringify(k)}:${canonicalV2(value[k])}`;
    }).join(',')}}`;
  }
  throw new Error(`canonicalV2: unsupported value (${typeof value})`);
}

const pick = (event, excluded) => Object.fromEntries(Object.entries(event).filter(([k]) => !excluded.has(k)));

export function signEventV2(event, signingSecret) {
  return crypto.createHmac('sha256', signingSecret).update(canonicalV2(pick(event, NOT_SIGNED))).digest('hex');
}

export function eventHashV2(event) {
  return crypto.createHash('sha256').update(canonicalV2(pick(event, NOT_HASHED))).digest('hex');
}

const HEX64 = /^[0-9a-f]{64}$/;

function safeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !HEX64.test(a) || !HEX64.test(b)) return false;
  return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

/** True or false, never throws (v1's verifyEventSignature throws on a length mismatch, F3). */
export function verifySignatureV2(event, signingSecret) {
  try {
    return safeEqualHex(event.signature, signEventV2(event, signingSecret));
  } catch {
    return false;
  }
}

/**
 * Turn a validated payload into the next block after `head` ({ blockIndex, eventHash } or null
 * for an empty chain). Pure: storing it and moving the head is the caller's job, in one
 * transaction (evidenceStore.js).
 */
export function linkEventV2(payload, head, signingSecret, signingKeyId) {
  const v = validateEvidenceEvent(payload);
  if (!v.valid) throw new Error(`invalid evidence event: ${v.errors.join('; ')}`);
  const event = {
    ...payload,
    signingKeyId,
    previousEventHash: head ? head.eventHash : GENESIS_HASH,
    blockIndex: head ? head.blockIndex + 1 : 1,
  };
  event.signature = signEventV2(event, signingSecret);
  event.eventHash = eventHashV2(event);
  return event;
}

/**
 * Walk a chain in stored order. Per block: schema, signature, hash, link and index. Then the
 * head record, unless `head` is undefined. Errors name blocks and checks only, never values.
 */
export function verifyChainV2(events, signingSecret, head) {
  const errors = [];
  const blocks = events.map((event, i) => {
    const n = i + 1;
    const payload = pick(event, new Set([...CHAIN_FIELDS, ...BOOKKEEPING]));
    const schema = event.chainVersion === CHAIN_VERSION && validateEvidenceEvent(payload).valid;
    let hash = false;
    try {
      hash = safeEqualHex(event.eventHash, eventHashV2(event));
    } catch {
      hash = false;
    }
    const expectedPrev = i === 0 ? GENESIS_HASH : events[i - 1].eventHash;
    const link = event.blockIndex === n && event.previousEventHash === expectedPrev;
    const signature = verifySignatureV2(event, signingSecret);
    if (!schema) errors.push(`block ${n}: not a valid chain v2 event`);
    if (!signature) errors.push(`block ${n}: signature`);
    if (!hash) errors.push(`block ${n}: hash`);
    if (!link) errors.push(`block ${n}: link`);
    return { blockIndex: event.blockIndex, eventId: event.eventId, schema, signature, hash, link };
  });
  if (head !== undefined) {
    const last = events[events.length - 1];
    const headOk = head === null
      ? events.length === 0
      : head.blockIndex === events.length && !!last && head.eventHash === last.eventHash;
    if (!headOk) errors.push('head does not match the last block');
  }
  return { ok: errors.length === 0, blocks, errors };
}
