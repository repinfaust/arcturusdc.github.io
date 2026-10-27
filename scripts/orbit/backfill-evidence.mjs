#!/usr/bin/env node
/**
 * Orbit evidence backfill (D-SITE-057): writes the Repinfaust / Lab evidence chain into the
 * dedicated evidence org as chain v2 events.
 *
 * SAFETY
 *   - Local only, with Application Default Credentials against stea-775cd. Never the public API.
 *   - Dry run by default. Writes only with --write.
 *   - Every commit, hash and machine-checkable number is verified against the local checkouts
 *     before anything is read from or written to Firestore (backfillCore.mjs). Any failure
 *     refuses the whole run.
 *   - Idempotent: a chain that already holds these events is refused unless --append, which
 *     needs --expect-head and writes only the missing tail.
 *   - After writing, the whole stored chain is re-read and verified (chainV2.verifyChainV2).
 *   - Prints keys, types, decision ids, commits, event ids, hashes and counts. No free text.
 *
 * USAGE (from this repo's root)
 *   node scripts/orbit/backfill-evidence.mjs \
 *     --sources ../repinfaust-lab/scripts/orbit/evidence-sources.json \
 *     --repo repinfaust-aid=../repinfaust-aid --repo repinfaust-lab=../repinfaust-lab \
 *     [--offline] [--write] [--append --expect-head <hash>]
 *   --offline verifies the sources only; it needs no credentials and touches no database.
 */

import { execFileSync } from 'child_process';
import crypto from 'crypto';
import { readFileSync } from 'fs';
import { buildEvidencePayloads, planBackfill } from './backfillCore.mjs';
import { appendEvidenceEvent, readEvidenceChain } from '../../src/lib/orbit/evidenceStore.js';
import { verifyChainV2 } from '../../src/lib/orbit/chainV2.js';
import { COLLECTION_NAMES } from '../../src/lib/orbit/collections.js';

const PROJECT_ID = 'stea-775cd';
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const value = (n) => (args.indexOf(n) >= 0 ? args[args.indexOf(n) + 1] : undefined);
const values = (n) => args.flatMap((a, i) => (a === n ? [args[i + 1]] : []));

const sourcesPath = value('--sources');
const repos = Object.fromEntries(values('--repo').map((r) => r.split('=')));
const WRITE = flag('--write');
const APPEND = flag('--append');
const OFFLINE = flag('--offline');
const EXPECT_HEAD = value('--expect-head');

if (!sourcesPath || Object.keys(repos).length === 0) {
  console.error('usage: --sources <file> --repo name=path [--repo …] [--offline] [--write] [--append --expect-head <hash>]');
  process.exit(2);
}
if (APPEND && !EXPECT_HEAD) {
  console.error('--append needs --expect-head <hash> (the current head, from a dry run)');
  process.exit(2);
}

const git = (repo, ...a) => {
  if (!repos[repo]) throw new Error(`no --repo given for ${repo}`);
  return execFileSync('git', ['-C', repos[repo], ...a], { stdio: ['ignore', 'pipe', 'ignore'] });
};
const verifier = {
  commitExists: (repo, c) => {
    try { git(repo, 'cat-file', '-e', `${c}^{commit}`); return true; } catch { return false; }
  },
  fileSha256: (repo, at, path) => {
    try { return crypto.createHash('sha256').update(git(repo, 'show', `${at}:${path}`)).digest('hex'); } catch { return null; }
  },
  readJson: (repo, at, path) => {
    try { return JSON.parse(git(repo, 'show', `${at}:${path}`).toString('utf8')); } catch { return null; }
  },
};

function table(payloads) {
  payloads.forEach((p, i) => {
    const hashes = ['rubricHash', 'preregHash', 'artifactHash'].filter((f) => p[f]).map((f) => `${f}=${p[f].slice(0, 12)}`).join(' ');
    const links = ['subjectEventId', 'supersedesEventId', 'withdrawsEventId'].filter((f) => p[f]).map((f) => `${f}=${p[f]}`).join(' ');
    const metrics = p.metrics ? Object.keys(p.metrics).length : 0;
    console.log(`${String(i + 1).padStart(3)}  ${p.eventType.padEnd(24)} ${p.system.padEnd(15)} ${p.decisionId.padEnd(7)} ${p.commit.padEnd(8)} ${p.occurredAt}  ${p.eventId}  ${hashes} metrics=${metrics} ${links}`);
  });
}

async function main() {
  const sources = JSON.parse(readFileSync(sourcesPath, 'utf8'));
  const { payloads, checks } = buildEvidencePayloads(sources, verifier);
  console.log(`sources verified: ${payloads.length} events, ${checks.length} checks, all passed (org ${sources.orgId})`);
  table(payloads);
  if (OFFLINE) return;

  const { default: admin } = await import('firebase-admin');
  admin.initializeApp({ projectId: PROJECT_ID });
  const db = admin.firestore();
  console.log(`\nproject ${PROJECT_ID} — ${WRITE ? 'WRITE' : 'DRY RUN (no writes)'}`);

  const orgs = await db.collection(COLLECTION_NAMES.ORGS).where('orgId', '==', sources.orgId).get();
  let org = orgs.empty ? null : orgs.docs[0].data();
  if (!org) {
    console.log(`org ${sources.orgId}: absent; ${WRITE ? 'creating it (random signing secret, no API key)' : 'would be created'}`);
    if (WRITE) {
      org = {
        orgId: sources.orgId,
        displayName: sources.orgId,
        signingSecret: crypto.randomBytes(32).toString('hex'),
        signingKeyId: `${sources.orgId}-key-1`,
        isSandbox: false,
        scopes: {},
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await db.collection(COLLECTION_NAMES.ORGS).add(org);
    }
  }

  const { events: existing, head } = await readEvidenceChain(db, sources.orgId);
  console.log(`stored chain: ${existing.length} blocks, head ${head ? `${head.blockIndex} ${head.eventHash}` : 'none'}`);
  if (APPEND && (!head || head.eventHash !== EXPECT_HEAD)) throw new Error('--expect-head does not match the stored head; nothing written');
  const { toWrite } = planBackfill(payloads, existing, { append: APPEND });
  console.log(`to write: ${toWrite.length}`);
  if (!WRITE || toWrite.length === 0) return;

  let expectHead = head ? { blockIndex: head.blockIndex, eventHash: head.eventHash } : null;
  for (const payload of toWrite) {
    const e = await appendEvidenceEvent(db, {
      orgId: sources.orgId, payload, signingSecret: org.signingSecret, signingKeyId: org.signingKeyId,
      serverTimestamp: () => admin.firestore.FieldValue.serverTimestamp(), expectHead,
    });
    expectHead = { blockIndex: e.blockIndex, eventHash: e.eventHash };
    console.log(`  wrote block ${e.blockIndex} ${e.eventId} ${e.eventHash}`);
  }

  const after = await readEvidenceChain(db, sources.orgId);
  const r = verifyChainV2(after.events, org.signingSecret, after.head);
  console.log(`\nverify: ${r.ok ? 'OK' : 'FAILED'} — ${after.events.length} blocks, head ${after.head.blockIndex} ${after.head.eventHash}`);
  if (!r.ok) {
    console.log(r.errors.join('\n'));
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
