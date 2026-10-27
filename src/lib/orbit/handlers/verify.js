/**
 * Orbit API: Cryptographic Verification (D-SITE-058)
 * POST /api/orbit/verify
 *
 * Chain mode, { orgId, chain: true }: owner only. Fetches the org's stored evidence chain
 * server-side and walks it with verifyChainV2: each block's schema, signature, hash, link and
 * index, then the stored head. The caller supplies nothing but the org id, so what is verified is
 * what is stored. The result is scoped: a time, a head, and "verified by Orbit, not independently"
 * (Orbit holds the signing secret; D-SITE-054).
 *
 * Event mode, { event, snapshotPointer?, simulateTampering? }: the POC's v1 check, kept as it was,
 * except that a malformed signature or snapshot hash is "not verified" rather than a 500 (F3), and
 * a snapshot is only looked up for a user the caller may read (D-SITE-050). It checks the event
 * the caller sends, not a stored one; chain v1 never hashed its links.
 *
 * Dependencies are injected so the handler is tested without Firebase or Next.
 */

import { verifyEventSignature, verifySnapshotHash, hashEvent, hashSnapshot } from '../signatures.js';
import { verifyChainV2 } from '../chainV2.js';
import { isOrbitOwner, canReadUserRecords } from '../owner.js';

export const CHAIN_SCOPE = 'Chain v2, as stored, verified by Orbit, not independently. Orbit holds the signing secret.';

const quietly = (fn) => {
  try {
    return fn();
  } catch {
    return false;
  }
};

export function makeVerifyHandler({ verifySession, getOrg, getSnapshot, readChain, now, json }) {
  async function verifyChain(session, orgId) {
    if (!isOrbitOwner(session)) {
      return json({ error: 'Only the Orbit owner can verify a stored chain' }, { status: 403 });
    }
    const org = await getOrg(orgId);
    if (!org) return json({ error: 'Organization not found' }, { status: 404 });

    const { events, head } = await readChain(orgId);
    const r = verifyChainV2(events, org.signingSecret, head ? { blockIndex: head.blockIndex, eventHash: head.eventHash } : null);
    const errors = events.length === 0 ? ['no blocks stored; nothing to verify', ...r.errors] : r.errors;
    return json({
      ok: events.length > 0 && r.ok,
      orgId,
      blocks: r.blocks,
      head: head ? { blockIndex: head.blockIndex, eventHash: head.eventHash } : null,
      errors,
      verifiedAt: now().toISOString(),
      scope: CHAIN_SCOPE,
    });
  }

  async function verifyEvent(session, body) {
    const { event, snapshotPointer, simulateTampering } = body;
    const eventToVerify = event || {};
    if (!eventToVerify.orgId) {
      return json({ error: 'orgId is required in event' }, { status: 400 });
    }
    const org = await getOrg(eventToVerify.orgId);
    if (!org) {
      return json({ error: 'Organization not found' }, { status: 404 });
    }

    const results = { eventSignature: null, snapshotHash: null, hashChain: null };

    // 1. Event signature (v1)
    if (eventToVerify.signature) {
      const eventForVerification = { ...eventToVerify };
      if (simulateTampering) {
        eventForVerification.eventType = 'TAMPERED_' + eventForVerification.eventType;
      }
      results.eventSignature = {
        signature: eventToVerify.signature,
        verified: quietly(() => verifyEventSignature(eventForVerification, org.signingSecret)),
        method: 'HMAC-SHA256',
      };
    }

    // 2. Snapshot hash, for a user the caller may read
    if (snapshotPointer) {
      const snapshot = await getSnapshot(snapshotPointer);
      if (snapshot && canReadUserRecords(session, snapshot.userId)) {
        let snapshotData = snapshot.data;
        if (simulateTampering) {
          snapshotData = { ...snapshotData, tampered: true };
        }
        results.snapshotHash = {
          snapshotHash: snapshot.snapshotHash,
          recomputedHash: hashSnapshot(snapshotData),
          verified: quietly(() => verifySnapshotHash(snapshotData, snapshot.snapshotHash)),
        };
      }
    }

    // 3. This event's own v1 hash. v1 never hashed the link, so this can't detect relinking.
    if (eventToVerify.previousEventHash && eventToVerify.eventHash) {
      const computedHash = hashEvent(eventToVerify);
      const isValid = computedHash === eventToVerify.eventHash;
      results.hashChain = {
        previousEventHash: eventToVerify.previousEventHash,
        thisEventHash: eventToVerify.eventHash,
        computedHash,
        blockIndex: eventToVerify.blockIndex || null,
        verified: isValid,
        note: isValid ? "This event's hash matches its contents (links not checked)" : 'Hash mismatch - event may have been modified after creation',
      };
    }

    return json({ success: true, results });
  }

  return async function POST(request) {
    try {
      const session = await verifySession(request);
      if (!session?.authenticated) {
        return json({ error: session?.error || 'Authentication required' }, { status: 401 });
      }
      const body = await request.json();
      if (body.chain === true) {
        if (typeof body.orgId !== 'string' || !body.orgId) {
          return json({ error: 'orgId is required for chain verification' }, { status: 400 });
        }
        return verifyChain(session, body.orgId);
      }
      if (!body.event && !body.eventId) {
        return json({ error: 'event or eventId is required' }, { status: 400 });
      }
      return verifyEvent(session, body);
    } catch (error) {
      console.error('Error verifying:', error?.code || error?.name || 'error');
      return json({ error: 'Failed to verify' }, { status: 500 });
    }
  };
}
