/**
 * Orbit evidence store (D-SITE-056)
 *
 * Evidence events live in their own collection, not orbit_ledger_events: that collection is
 * per user, the POC's reset deletes from it, and consent updates and the policy engine run on
 * every write there. Here there is one chain per org, and a head document per org.
 *
 * Every append reads the head, links the event (chainV2.linkEventV2) and writes both the event
 * and the new head in one transaction, so two appends can't fork the chain. Block documents are
 * created, never set, so an existing block can't be overwritten even if the head is lost.
 * Server-side only (Admin SDK); firestore.rules denies all client access.
 */

import { linkEventV2 } from './chainV2.js';

export const EVIDENCE_COLLECTIONS = {
  EVENTS: 'orbit_evidence_events',
  HEADS: 'orbit_evidence_heads',
};

const blockDocId = (orgId, blockIndex) => `${orgId}__${String(blockIndex).padStart(8, '0')}`;
const sameHead = (a, b) => (a === null || b === null ? a === b : a.blockIndex === b.blockIndex && a.eventHash === b.eventHash);

/**
 * Append one event. `expectHead` ({blockIndex, eventHash}, or null for an empty chain) makes the
 * append refuse if anything else was appended first; omit it to append at whatever the head is.
 * Returns the stored event.
 */
export async function appendEvidenceEvent(db, { orgId, payload, signingSecret, signingKeyId, serverTimestamp, expectHead }) {
  if (payload?.orgId !== orgId) throw new Error('payload orgId does not match the chain orgId');
  const headRef = db.collection(EVIDENCE_COLLECTIONS.HEADS).doc(orgId);

  return db.runTransaction(async (tx) => {
    const headSnap = await tx.get(headRef);
    const head = headSnap.exists ? { blockIndex: headSnap.data().blockIndex, eventHash: headSnap.data().eventHash } : null;
    if (expectHead !== undefined && !sameHead(expectHead, head)) {
      throw new Error('head has moved since it was read; nothing written');
    }
    const event = linkEventV2(payload, head, signingSecret, signingKeyId);
    const eventRef = db.collection(EVIDENCE_COLLECTIONS.EVENTS).doc(blockDocId(orgId, event.blockIndex));
    tx.create(eventRef, { ...event, recordedAt: serverTimestamp() });
    tx.set(headRef, { orgId, blockIndex: event.blockIndex, eventHash: event.eventHash, updatedAt: serverTimestamp() });
    return event;
  });
}

/** The whole chain for an org, in block order, with its head (null when empty). */
export async function readEvidenceChain(db, orgId) {
  const [eventsSnap, headSnap] = await Promise.all([
    db.collection(EVIDENCE_COLLECTIONS.EVENTS).where('orgId', '==', orgId).get(),
    db.collection(EVIDENCE_COLLECTIONS.HEADS).doc(orgId).get(),
  ]);
  const events = eventsSnap.docs.map((d) => d.data()).sort((a, b) => a.blockIndex - b.blockIndex);
  return { events, head: headSnap.exists ? headSnap.data() : null };
}
