// Merging an AI CV extraction into a profile/evidence library the user has
// already curated (D-SITE-075). Extraction is a suggestion: it may only fill
// gaps, never overwrite what the user has set. No dependencies; client-safe.

const isEmpty = (v) => v == null || v === '' || v === 0 || (Array.isArray(v) && v.filter(Boolean).length === 0);

// Fill only the profile fields that are currently empty.
export function fillEmptyProfile(existing = {}, extracted = {}) {
  const out = { ...existing };
  for (const [k, v] of Object.entries(extracted || {})) {
    if (isEmpty(v)) continue;
    if (isEmpty(out[k])) out[k] = v;
  }
  return out;
}

export function hasEvidence(anchors) {
  return Array.isArray(anchors) && anchors.some((a) => a && (a.company || (a.bullets || []).some(Boolean)));
}

// A role is "already there" when the employer (text before any " — " or "|"
// qualifier) and the period match, ignoring case, spacing and dash style.
const norm = (s) => String(s || '').toLowerCase().replace(/[‒-―-]/g, '-').replace(/\s+/g, ' ').trim();
const employer = (company) => norm(String(company || '').split(/\s[—|]\s|\s-\s/)[0]);
const anchorKey = (a) => `${employer(a?.company)}|${norm(a?.period)}`;

// Existing anchors kept as they are; extracted anchors appended only when no
// existing anchor has the same employer and period.
export function mergeNewAnchors(existing = [], extracted = []) {
  const keys = new Set((existing || []).map(anchorKey));
  const added = (extracted || []).filter((a) => a && a.company && !keys.has(anchorKey(a)));
  return { anchors: [...(existing || []), ...added], addedCount: added.length };
}
