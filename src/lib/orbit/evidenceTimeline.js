/**
 * The evidence timeline's data (D-SITE-059). Read-only. The owner check comes first, so nothing
 * is read for anyone else. Rows are plain JSON for the client component: no signatures, no server
 * bookkeeping (recordedAt), and links resolved to block numbers.
 */

import { isOrbitOwner } from './owner.js';
import { EVIDENCE_FAMILIES } from './eventTypes.js';

export const EVIDENCE_ORG_ID = 'repinfaust-evidence';
const HASH_FIELDS = ['policyHash', 'promptHash', 'rubricHash', 'previousRubricHash', 'preregHash', 'artifactHash'];
const LINK_FIELDS = ['subjectEventId', 'supersedesEventId', 'withdrawsEventId'];

export function buildTimeline(events) {
  const blockOf = new Map(events.map((e) => [e.eventId, e.blockIndex]));
  return events.map((e) => ({
    blockIndex: e.blockIndex,
    eventId: e.eventId,
    eventType: e.eventType,
    family: EVIDENCE_FAMILIES.control.includes(e.eventType) ? 'control' : 'evaluation',
    system: e.system,
    version: e.version ?? null,
    decisionId: e.decisionId ?? null,
    relatedDecisionIds: e.relatedDecisionIds ?? [],
    commit: e.commit ?? null,
    occurredAt: e.occurredAt,
    hashes: HASH_FIELDS.filter((f) => e[f]).map((f) => [f, e[f]]),
    modelSnapshots: e.modelSnapshots ?? [],
    metrics: Object.entries(e.metrics ?? {}).sort(([a], [b]) => a.localeCompare(b)),
    links: LINK_FIELDS.filter((f) => e[f]).map((f) => ({ field: f, eventId: e[f], blockIndex: blockOf.get(e[f]) ?? null })),
    eventHash: e.eventHash,
    previousEventHash: e.previousEventHash,
    backfilled: e.backfilled === true,
  }));
}

export async function loadTimeline({ session, readChain, orgId = EVIDENCE_ORG_ID }) {
  if (!isOrbitOwner(session)) return { status: 'forbidden' };
  const { events, head } = await readChain(orgId);
  return {
    status: 'ok',
    orgId,
    rows: buildTimeline(events),
    head: head ? { blockIndex: head.blockIndex, eventHash: head.eventHash } : null,
  };
}
