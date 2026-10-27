// Integrity claims stay scoped until chain v2 is live and verified (D-SITE-049, D-SITE-052).
// Lift a phrase only with a D-SITE entry that cites the verification ("for the evidence ledger,
// verified <date>").

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ROOT = new URL('../../', import.meta.url);
const read = (p) => readFileSync(new URL(p, ROOT), 'utf8');
const PAGES = [
  'src/app/apps/stea/orbit/page.js',
  'src/app/apps/stea/orbit/overview/page.js',
  'src/app/apps/stea/orbit/poc/page.js',
];
const BANNED = [
  /tamper[- ]evident/i,
  /cryptographically[- ]verifiable/i,
  /immutable/i,
  /cannot be tampered/i,
  /hash chain intact - \{/i, // a "chain intact" tick computed from nothing
  /each event's hash includes the previous/i, // false under chain v1 (F1)
  /Logging SDK/, // no SDK exists in this repository
];

for (const page of PAGES) {
  test(`${page}: no unverified integrity claim`, () => {
    const src = read(page);
    for (const re of BANNED) assert.doesNotMatch(src, re, `${page} matches ${re}`);
  });
}

test('AI Act bundle: no hard-coded tamper count or "all records intact" message', () => {
  const src = read('src/app/apps/stea/orbit/AI-Act-Technical-DocumentationBundle/page.js');
  assert.doesNotMatch(src, /tamperSignals/);
  assert.doesNotMatch(src, /All tamper-evident records are intact/);
});
