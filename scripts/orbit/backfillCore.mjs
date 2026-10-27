/**
 * Orbit evidence backfill, pure core (D-SITE-057). No I/O: git access is injected as `verifier`.
 *
 * A sources file lists events in chain order. Each has a key, the repository it comes from, a
 * payload (no orgId, eventId or chain fields; those are set here), optional links to earlier
 * events by key, and checks that tie its values to the repository:
 *   sha256 / sha256-12   the field equals the sha256 (or its first 12 hex) of path@at
 *   json / json-length   the field equals a value (or an array length) at a JSON pointer in path@at;
 *                        booleans compare as 1/0
 *   a3                   the field equals a figure recomputed from the local A3 results files by
 *                        xyz's own oq25_recompute.py (scripts/orbit/a3_results.py, D-SITE-062).
 *                        If the files are absent the check is skipped and reported (ok: null);
 *                        if present, any mismatch or refusal refuses the run.
 * Every payload's commit must exist in its repository. Every failure is collected and reported
 * together; nothing is returned unless all pass.
 */

import crypto from 'crypto';
import { validateEvidenceEvent } from '../../src/lib/orbit/eventTypes.js';

const SET_HERE = ['orgId', 'eventId', 'chainVersion', 'backfilled', 'signature', 'eventHash', 'previousEventHash', 'blockIndex', 'signingKeyId'];
const LINK_FIELDS = ['subjectEventId', 'supersedesEventId', 'withdrawsEventId'];

export function deterministicEventId(orgId, key) {
  return `ev_${crypto.createHash('sha256').update(`${orgId}|${key}`).digest('hex').slice(0, 24)}`;
}

function getField(payload, field) {
  return field.split('.').reduce((o, k) => (o == null ? undefined : o[k]), payload);
}

function jsonPointer(doc, pointer) {
  return pointer.split('/').slice(1).map((p) => p.replace(/~1/g, '/').replace(/~0/g, '~'))
    .reduce((o, k) => (o == null ? undefined : o[k]), doc);
}

function expected(check, repo, verifier) {
  if (check.kind === 'sha256' || check.kind === 'sha256-12') {
    const h = verifier.fileSha256(repo, check.at, check.path);
    if (h == null) return { missing: `${check.path}@${check.at} not found` };
    return { value: check.kind === 'sha256' ? h : h.slice(0, 12) };
  }
  if (check.kind === 'json' || check.kind === 'json-length') {
    const doc = verifier.readJson(repo, check.at, check.path);
    if (doc == null) return { missing: `${check.path}@${check.at} not found` };
    const v = jsonPointer(doc, check.pointer);
    if (check.kind === 'json-length') return Array.isArray(v) ? { value: v.length } : { missing: `${check.pointer} is not an array` };
    return { value: typeof v === 'boolean' ? (v ? 1 : 0) : v };
  }
  if (check.kind === 'a3') {
    const a3 = verifier.a3Results ? verifier.a3Results(repo) : { present: false };
    if (a3.error) return { refused: `A3 results refused: ${a3.error}` };
    if (!a3.present) return { skipped: 'A3 results files not present; figure transcribed, not checked' };
    const v = `${check.file}.${check.value}`.split('.').reduce((o, k) => (o == null ? undefined : o[k]), a3);
    return v === undefined ? { missing: `a3 ${check.file}.${check.value} not computed` } : { value: v };
  }
  return { missing: `unknown check kind ${check.kind}` };
}

export function buildEvidencePayloads(sources, verifier) {
  const errors = [];
  const checks = [];
  const idByKey = new Map();
  const payloads = [];

  for (const src of sources.events) {
    const { key, repo } = src;
    if (idByKey.has(key)) {
      errors.push(`duplicate key ${key}`);
      continue;
    }
    for (const f of SET_HERE) {
      if (src.payload[f] !== undefined) errors.push(`${key}: ${f} is set by the backfill, not the sources`);
    }
    const eventId = deterministicEventId(sources.orgId, key);
    const payload = { ...src.payload, orgId: sources.orgId, eventId, chainVersion: 2, backfilled: true };

    for (const [field, targetKey] of Object.entries(src.links || {})) {
      if (!LINK_FIELDS.includes(field)) errors.push(`${key}: ${field} is not a link field`);
      else if (!idByKey.has(targetKey)) errors.push(`${key}: link ${field} -> ${targetKey} is not an earlier event`);
      else payload[field] = idByKey.get(targetKey);
    }

    const commitOk = verifier.commitExists(repo, payload.commit);
    checks.push({ key, field: 'commit', ok: commitOk });
    if (!commitOk) errors.push(`${key}: commit ${payload.commit} not found in ${repo}`);

    for (const check of src.verify || []) {
      const exp = expected(check, repo, verifier);
      if (exp.skipped) {
        checks.push({ key, field: check.field, kind: check.kind, ok: null, note: exp.skipped });
        continue;
      }
      if (exp.refused) {
        checks.push({ key, field: check.field, kind: check.kind, ok: false });
        errors.push(`${key}: ${exp.refused}`);
        continue;
      }
      const actual = getField(payload, check.field);
      const ok = exp.missing === undefined && actual === exp.value;
      checks.push({ key, field: check.field, kind: check.kind, ok });
      const what = check.kind === 'a3' ? `a3 ${check.file}.${check.value}` : `${check.kind} of ${check.path}@${check.at}`;
      if (!ok) errors.push(`${key}: ${check.field} ${exp.missing ?? `does not match ${what}`}`);
    }

    const v = validateEvidenceEvent(payload);
    if (!v.valid) errors.push(...v.errors.map((e) => `${key}: ${e}`));

    idByKey.set(key, eventId);
    payloads.push(payload);
  }

  const unique = [...new Set(errors)];
  if (unique.length) throw new Error(`sources refused (${unique.length}):\n  ${unique.join('\n  ')}`);
  return { payloads, checks };
}

/**
 * What to write, given the chain already stored. An empty chain takes everything. A chain whose
 * eventIds are a prefix of the payloads takes the rest, but only with append. Anything else is
 * refused: the backfill never writes around events it didn't produce.
 */
export function planBackfill(payloads, existing, { append }) {
  const mismatch = existing.findIndex((e, i) => !payloads[i] || payloads[i].eventId !== e.eventId);
  if (mismatch !== -1) throw new Error(`stored block ${mismatch + 1} does not match the sources; nothing written`);
  if (existing.length > 0 && !append) {
    throw new Error(`the chain already holds ${existing.length} of these events; pass --append --expect-head <hash> to add the rest`);
  }
  return { toWrite: payloads.slice(existing.length) };
}
