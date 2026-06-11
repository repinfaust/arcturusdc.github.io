#!/usr/bin/env node
// Dialled changelog leak test (build spec §5.5 — hard acceptance criterion).
// Scans the client-deliverable build output (.next/static — every byte of it
// is servable to browsers) for strings that exist only in the INTERNAL tech
// tree dataset. Any hit = the internal data reached the public bundle = the
// build fails. Runs automatically via the `postbuild` npm script.
//
// Server-side files (.next/server) are intentionally out of scope: they are
// not shipped to browsers, and the internal route legitimately lives there
// behind its env-var gate.
import fs from 'fs';
import path from 'path';

const TARGET = path.join(process.cwd(), '.next', 'static');

// Known-internal strings per §5.5, plus distinctive fragments of internal
// `why`/`desc` fields as defence in depth.
const FORBIDDEN = [
  'Ashleigh',
  'Jo reviews',
  'pilot partner',
  'Rider Experience Passport',
  'Ownership / Anti-Theft Identity',
  'Event Checkpoint Validation',
  'anti-gatekeeping',
  'BikeRegister',
  'Non-goal: identity systems',
  'scores:{c:', // raw scores block, any minification
  '"scores"',
  'mtb_tyres_uk', // internal desc fragment
  'Wayne’s feedback card',
  '>Avoid<',
  '>Kill<',
  '"Avoid"',
  '"Kill"',
];

if (!fs.existsSync(TARGET)) {
  console.error(`[leak-test] ${TARGET} does not exist — run after \`next build\`.`);
  process.exit(1);
}

const hits = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(p);
    } else if (/\.(js|html|json|txt|rsc|css|map)$/.test(entry.name)) {
      const content = fs.readFileSync(p, 'utf8');
      for (const needle of FORBIDDEN) {
        if (content.includes(needle)) {
          hits.push({ file: path.relative(process.cwd(), p), needle });
        }
      }
    }
  }
}

walk(TARGET);

if (hits.length > 0) {
  console.error('[leak-test] FAIL — internal Dialled tech-tree content found in the public bundle:');
  for (const h of hits) console.error(`  "${h.needle}" in ${h.file}`);
  console.error('[leak-test] Internal content must be stripped at build time (spec §5.1). Aborting.');
  process.exit(1);
}

console.log(`[leak-test] PASS — 0 matches for ${FORBIDDEN.length} forbidden strings across .next/static`);
