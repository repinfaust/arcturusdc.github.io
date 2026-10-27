#!/usr/bin/env node
/**
 * Anchor the evidence chain head with RFC 3161 tokens from DigiCert and Sectigo (D-SITE-063).
 * The backfill runs this after every write; run it alone to anchor or to re-check.
 *
 * SAFETY
 *   - Dry run by default: prints the head and the imprint that would be sent, and sends nothing.
 *   - --send posts the imprint (a SHA-256 of {orgId, blockIndex, eventHash}; nothing else) to
 *     both TSAs, verifies both replies with openssl, and stores one anchor record only if both
 *     verify. Any failure stores nothing.
 *   - --check re-verifies every stored token from its imprint with openssl, and checks each
 *     anchor still matches the stored chain.
 *   - Local only, with Application Default Credentials against stea-775cd.
 *
 * USAGE (from this repo's root)
 *   node scripts/orbit/anchor-head.mjs [--org repinfaust-evidence] [--send | --check] [--ca-file roots.pem]
 * openssl must support `ts` (OpenSSL 3; on macOS set ORBIT_OPENSSL=/opt/homebrew/opt/openssl@3/bin/openssl
 * if the system LibreSSL refuses). Without --ca-file the machine's trusted roots are used.
 */

import admin from 'firebase-admin';
import { ANCHOR_TSAS, ANCHOR_COLLECTION, checkAnchors } from '../../src/lib/orbit/anchors.js';
import { readEvidenceChain } from '../../src/lib/orbit/evidenceStore.js';
import { anchorHead, httpPost, systemRootsFile, verifyStoredToken } from './anchor.mjs';

const PROJECT_ID = 'stea-775cd';
const args = process.argv.slice(2);
const value = (n, d) => (args.indexOf(n) >= 0 ? args[args.indexOf(n) + 1] : d);
const ORG = value('--org', 'repinfaust-evidence');

export async function runAnchor(db, { orgId, send, caFileArg, log = console.log }) {
  const roots = systemRootsFile(caFileArg);
  try {
    const tsas = ANCHOR_TSAS.map((t) => ({ ...t, caFile: roots.caFile, post: httpPost(t.url) }));
    const r = await anchorHead(db, { orgId, tsas, send, serverTimestamp: () => admin.firestore.FieldValue.serverTimestamp() });
    log(`anchor: ${r.status}${r.blockIndex ? ` — block ${r.blockIndex} ${r.eventHash}` : ''}${r.imprint ? ` imprint ${r.imprint}` : ''}`);
    if (r.status === 'dry-run') log(`would send the imprint to: ${r.tsas.join(', ')} (re-run with --send)`);
    if (r.status === 'anchored') for (const [id, t] of Object.entries(r.tokens)) log(`  ${id}: ${t}`);
    return r;
  } finally {
    roots.cleanup();
  }
}

async function check(db, orgId, caFileArg) {
  const { events } = await readEvidenceChain(db, orgId);
  const anchors = (await db.collection(ANCHOR_COLLECTION).where('orgId', '==', orgId).get()).docs.map((d) => d.data());
  const c = checkAnchors(anchors, events);
  const roots = systemRootsFile(caFileArg);
  let ok = c.ok;
  try {
    for (const a of anchors) {
      for (const t of ANCHOR_TSAS) {
        const tok = a.tokens?.[t.id];
        const v = tok ? verifyStoredToken({ imprint: a.imprint, replyDer: Buffer.from(tok.replyDer, 'base64'), caFile: roots.caFile, vendor: t.vendor }) : { ok: false, error: 'missing' };
        ok = ok && v.ok;
        console.log(`block ${a.blockIndex} ${t.id}: ${v.ok ? `token OK (${tok.genTime})` : `FAILED ${v.error}`}`);
      }
    }
  } finally {
    roots.cleanup();
  }
  for (const a of c.anchors) console.log(`block ${a.blockIndex}: ${a.blockMatches && a.imprintMatches ? 'matches the stored chain' : 'DOES NOT match the stored chain'}`);
  console.log(`check: ${ok ? 'OK' : 'FAILED'} — ${anchors.length} anchors`);
  if (!ok) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  admin.initializeApp({ projectId: PROJECT_ID });
  const db = admin.firestore();
  const run = args.includes('--check')
    ? check(db, ORG, value('--ca-file'))
    : runAnchor(db, { orgId: ORG, send: args.includes('--send'), caFileArg: value('--ca-file') });
  run.catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
