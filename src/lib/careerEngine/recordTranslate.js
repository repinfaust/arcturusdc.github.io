// Whole-record translation helpers for Squared (D-SITE-035). No dependencies:
// the server uses them to chunk and validate, the review screen re-runs the
// same checks live as the user edits a line.

export const CHUNK_CHARS = 12000; // one action per chunk
export const MAX_CHUNKS = 3;
export const MAX_TRANSLATIONS = 200;
export const CATEGORIES = ['Leadership', 'Responsibility', 'Achievements', 'Qualifications', 'Skills'];

// Split on paragraph boundaries into chunks of at most CHUNK_CHARS. A single
// paragraph longer than that is hard-split.
export function chunkText(text = '') {
  const paras = text.replace(/\r\n/g, '\n').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks = [];
  let cur = '';
  for (let p of paras) {
    while (p.length > CHUNK_CHARS) {
      if (cur) { chunks.push(cur); cur = ''; }
      chunks.push(p.slice(0, CHUNK_CHARS));
      p = p.slice(CHUNK_CHARS);
    }
    if (cur && cur.length + p.length + 2 > CHUNK_CHARS) { chunks.push(cur); cur = ''; }
    cur = cur ? `${cur}\n\n${p}` : p;
  }
  if (cur) chunks.push(cur);
  return chunks;
}

const norm = (s = '') => s.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
  .replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();

// Numbers as written (4.2, 28, 1,200 -> 1200, 91%). Units and £ are ignored so
// "£4.2M" and "4.2 million" both yield 4.2.
export function numbersIn(s = '') {
  return (s.match(/\d[\d,]*(?:\.\d+)?/g) || []).map((n) => n.replace(/,/g, ''));
}

// found: the "in service" text appears verbatim (ignoring case/whitespace) in
// the record. numbersOk: every number in the civilian line is in the original.
export function validateLine({ mil = '', civ = '' }, sourceText = '') {
  const found = !!mil.trim() && norm(sourceText).includes(norm(mil));
  const milNums = new Set(numbersIn(mil));
  const extra = numbersIn(civ).filter((n) => !milNums.has(n));
  return { found, numbersOk: extra.length === 0, extraNumbers: extra };
}

// Inferred claims still in the civilian line and not yet confirmed by the user
// ("I can back this up"). Editing a phrase out of the line clears it.
export function unresolvedClaims({ civ = '', added = [], confirmed = [] }) {
  const c = norm(civ);
  return (added || []).filter((ph) => c.includes(norm(ph)) && !(confirmed || []).includes(ph));
}
