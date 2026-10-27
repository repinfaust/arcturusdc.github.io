/**
 * Independent anchors for the evidence chain head (D-SITE-063)
 *
 * After each append batch the head is time-stamped by two unrelated RFC 3161 authorities,
 * DigiCert and Sectigo. Each signs "this imprint existed at time T". The imprint commits to the
 * org, the block index and that block's hash, so once anchored, no block at or before it can be
 * rewritten without the change showing, Orbit included. Tokens are checked with openssl by
 * scripts/orbit/anchor.mjs when they're issued, and by anyone afterwards with `openssl ts
 * -verify`. This module is the part the server can run: imprints, and whether each stored anchor
 * still matches the stored chain (it doesn't re-check token signatures; there's no openssl on the
 * server).
 */

import crypto from 'crypto';
import { canonicalV2 } from './chainV2.js';

export const ANCHOR_COLLECTION = 'orbit_evidence_anchors';

// `vendor` must appear in a certificate subject inside the returned token (anchor.mjs).
export const ANCHOR_TSAS = [
  { id: 'digicert', url: 'http://timestamp.digicert.com', vendor: 'DigiCert' },
  { id: 'sectigo', url: 'http://timestamp.sectigo.com', vendor: 'Sectigo' },
];

export function anchorImprint({ orgId, blockIndex, eventHash }) {
  return crypto.createHash('sha256').update(canonicalV2({ orgId, blockIndex, eventHash })).digest('hex');
}

export const anchorDocId = (orgId, blockIndex) => `${orgId}__${String(blockIndex).padStart(8, '0')}`;

/**
 * Each stored anchor must name a stored block with the same hash, carry the imprint recomputed
 * from it, and hold a token from every configured TSA. Returns per-anchor results, newest last.
 */
export function checkAnchors(anchors, events) {
  const byIndex = new Map(events.map((e) => [e.blockIndex, e]));
  const results = [...anchors]
    .sort((a, b) => a.blockIndex - b.blockIndex)
    .map((a) => {
      const block = byIndex.get(a.blockIndex);
      const blockMatches = !!block && block.eventHash === a.eventHash;
      const imprintMatches = a.imprint === anchorImprint({ orgId: a.orgId, blockIndex: a.blockIndex, eventHash: a.eventHash });
      const tsas = ANCHOR_TSAS.map((t) => ({ id: t.id, vendor: t.vendor, genTime: a.tokens?.[t.id]?.genTime ?? null, present: !!a.tokens?.[t.id]?.replyDer }));
      return { blockIndex: a.blockIndex, eventHash: a.eventHash, imprint: a.imprint, blockMatches, imprintMatches, tsas, ok: blockMatches && imprintMatches && tsas.every((t) => t.present) };
    });
  return { ok: results.every((r) => r.ok), anchors: results };
}
