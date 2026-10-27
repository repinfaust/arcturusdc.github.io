/**
 * RFC 3161 anchoring of the evidence head, the openssl side (D-SITE-063).
 *
 * makeQuery    builds a time-stamp query (SHA-256 imprint, a random nonce, certificate requested)
 * verifyReply  checks a reply with `openssl ts -verify` against the query (imprint and nonce) and
 *              a CA file, then reads its status, time, serial and policy, requires a certificate in
 *              the token whose subject names the expected vendor, and refuses a time more than 10
 *              minutes from the local clock
 * anchorHead   reads the head; unless it's already anchored, asks every TSA, verifies every
 *              reply, and only then stores one anchor record. Any failure stores nothing.
 *
 * No network here: `post` is injected (anchor-head.mjs passes fetch). openssl is `openssl` on the
 * PATH, or ORBIT_OPENSSL (macOS's LibreSSL may lack `ts`; Homebrew openssl@3 has it).
 */

import { execFileSync } from 'child_process';
import { X509Certificate } from 'crypto';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { anchorImprint, anchorDocId, ANCHOR_COLLECTION } from '../../src/lib/orbit/anchors.js';
import { readEvidenceChain } from '../../src/lib/orbit/evidenceStore.js';

const OPENSSL = process.env.ORBIT_OPENSSL || 'openssl';
const MAX_SKEW_MS = 10 * 60 * 1000;
const ossl = (cwd, ...a) => execFileSync(OPENSSL, a, { cwd, stdio: ['ignore', 'pipe', 'pipe'] }).toString('utf8');

// openssl's useful lines, without the "Using configuration from …" preamble (D-SITE-068).
function opensslError(e) {
  const lines = String(e.stderr || e.message).split('\n').map((l) => l.trim()).filter((l) => l && !/^Using configuration from/.test(l));
  return lines.slice(0, 4).join(' | ') || 'no detail';
}

// Subject and issuer of each certificate inside a reply's token, for diagnosing chain failures.
function tokenCertificates(dir) {
  try {
    ossl(dir, 'ts', '-reply', '-in', 'r.tsr', '-token_out', '-out', 'diag.der');
    return ossl(dir, 'pkcs7', '-inform', 'DER', '-in', 'diag.der', '-print_certs', '-noout')
      .split('\n').filter((l) => /^(subject|issuer)\s*=/.test(l)).join(' ; ');
  } catch {
    return 'could not list';
  }
}

const PEM_BLOCK = /-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g;

/**
 * The machine's roots minus any self-signed root sharing its name with a certificate the token
 * carries (D-SITE-069). Some TSAs (Sectigo) list a cross-signed root in the token's ESS
 * signing-certificate attribute; if the machine also trusts a self-signed root of the same name
 * (macOS does for Sectigo R46), openssl ends the chain there, the chain no longer matches the ESS
 * list, and newer openssl refuses with "ess cert id not found". Dropping that root makes openssl
 * take the chain the token names, up to another root the machine trusts. Removing roots can only
 * narrow trust.
 */
export function rootsWithoutShadowed(rootsPem, tokenCertPems) {
  const tokenSubjects = new Set(tokenCertPems.map((p) => new X509Certificate(p).subject));
  const kept = (rootsPem.match(PEM_BLOCK) || []).filter((pem) => {
    try {
      const c = new X509Certificate(pem);
      return !(c.subject === c.issuer && tokenSubjects.has(c.subject));
    } catch {
      return true; // leave anything we can't parse to openssl, as before
    }
  });
  return `${kept.join('\n')}\n`;
}

// Verify, and on an ESS chain mismatch retry once with the shadowing roots removed.
function verifyWithEssFallback(dir, args, caFile) {
  try {
    ossl(dir, ...args, '-CAfile', caFile, ...untrustedArgs());
    return { chain: 'machine roots' };
  } catch (e) {
    if (!/ess cert id not found/i.test(String(e.stderr || ''))) throw e;
    ossl(dir, 'ts', '-reply', '-in', 'r.tsr', '-token_out', '-out', 'ess.der');
    const tokenCerts = ossl(dir, 'pkcs7', '-inform', 'DER', '-in', 'ess.der', '-print_certs').match(PEM_BLOCK) || [];
    writeFileSync(join(dir, 'roots-narrowed.pem'), rootsWithoutShadowed(readFileSync(caFile, 'utf8'), tokenCerts));
    ossl(dir, ...args, '-CAfile', join(dir, 'roots-narrowed.pem'), ...untrustedArgs());
    return { chain: 'token-named chain (shadowing self-signed root set aside)' };
  }
}

// Extra intermediate certificates, if a TSA's token doesn't carry its full chain (ORBIT_TSA_UNTRUSTED).
const untrustedArgs = () => (process.env.ORBIT_TSA_UNTRUSTED ? ['-untrusted', process.env.ORBIT_TSA_UNTRUSTED] : []);

function inTemp(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'orbit-anchor-'));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export function makeQuery(imprintHex) {
  if (!/^[0-9a-f]{64}$/.test(imprintHex)) throw new Error('imprint must be 64 hex characters');
  return inTemp((dir) => {
    ossl(dir, 'ts', '-query', '-digest', imprintHex, '-sha256', '-cert', '-out', 'q.tsq');
    return readFileSync(join(dir, 'q.tsq'));
  });
}

const field = (text, label) => (text.match(new RegExp(`^${label}:\\s*(.+)$`, 'm')) || [])[1]?.trim() ?? null;

export function verifyReply({ queryDer, replyDer, caFile, vendor, now }) {
  return inTemp((dir) => {
    writeFileSync(join(dir, 'q.tsq'), queryDer);
    writeFileSync(join(dir, 'r.tsr'), replyDer);
    let chain;
    try {
      ({ chain } = verifyWithEssFallback(dir, ['ts', '-verify', '-queryfile', 'q.tsq', '-in', 'r.tsr'], caFile));
    } catch (e) {
      return { ok: false, error: `openssl ts -verify failed: ${opensslError(e)} — certificates in the token: ${tokenCertificates(dir)}` };
    }
    let text;
    let certs;
    try {
      text = ossl(dir, 'ts', '-reply', '-in', 'r.tsr', '-text');
      ossl(dir, 'ts', '-reply', '-in', 'r.tsr', '-token_out', '-out', 't.der');
      certs = ossl(dir, 'pkcs7', '-inform', 'DER', '-in', 't.der', '-print_certs', '-noout');
    } catch (e) {
      return { ok: false, error: 'could not read the reply' };
    }
    const status = (field(text, 'Status') || '').replace(/\.$/, '');
    const genTimeRaw = field(text, 'Time stamp');
    const genMs = genTimeRaw ? Date.parse(genTimeRaw) : NaN;
    const result = {
      chain,
      status,
      genTime: Number.isNaN(genMs) ? null : new Date(genMs).toISOString(),
      serial: field(text, 'Serial number'),
      policy: field(text, 'Policy OID'),
    };
    if (status !== 'Granted' && status !== 'Granted with modifications') return { ...result, ok: false, error: `status ${status || 'unknown'}` };
    if (!result.genTime) return { ...result, ok: false, error: 'no readable time in the reply' };
    if (Math.abs(genMs - now.getTime()) > MAX_SKEW_MS) return { ...result, ok: false, error: 'time differs from the local clock by more than 10 minutes' };
    const subjects = certs.split('\n').filter((l) => /^subject\s*=/.test(l));
    if (!subjects.some((s) => s.toLowerCase().includes(vendor.toLowerCase()))) {
      return { ...result, ok: false, error: `no certificate in the token names the vendor ${vendor}` };
    }
    return { ...result, ok: true };
  });
}

/**
 * Re-check a stored token later, from the imprint alone (no query file): the same check anyone
 * can run with `openssl ts -verify -digest <imprint> -in <token>.tsr -CAfile <roots>`.
 */
export function verifyStoredToken({ imprint, replyDer, caFile, vendor }) {
  return inTemp((dir) => {
    writeFileSync(join(dir, 'r.tsr'), replyDer);
    try {
      verifyWithEssFallback(dir, ['ts', '-verify', '-digest', imprint, '-in', 'r.tsr'], caFile);
    } catch (e) {
      return { ok: false, error: `openssl ts -verify failed: ${opensslError(e)} — certificates in the token: ${tokenCertificates(dir)}` };
    }
    ossl(dir, 'ts', '-reply', '-in', 'r.tsr', '-token_out', '-out', 't.der');
    const certs = ossl(dir, 'pkcs7', '-inform', 'DER', '-in', 't.der', '-print_certs', '-noout');
    const named = certs.split('\n').some((l) => /^subject\s*=/.test(l) && l.toLowerCase().includes(vendor.toLowerCase()));
    return named ? { ok: true } : { ok: false, error: `no certificate in the token names the vendor ${vendor}` };
  });
}

/** POST a DER query to a TSA over HTTP; the reply is checked by verifyReply, not trusted. */
export function httpPost(url, fetchImpl = fetch) {
  return async (queryDer) => {
    const res = await fetchImpl(url, { method: 'POST', headers: { 'Content-Type': 'application/timestamp-query' }, body: queryDer });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  };
}

/**
 * The CA file to verify against: --ca-file if given; else the machine's trusted roots (macOS
 * System Roots keychain exported to a temp file, or the Linux bundle). Returns { caFile, cleanup }.
 */
export function systemRootsFile(explicit) {
  if (explicit) return { caFile: explicit, cleanup: () => {} };
  if (process.platform === 'darwin') {
    const dir = mkdtempSync(join(tmpdir(), 'orbit-roots-'));
    const pem = execFileSync('security', ['find-certificate', '-a', '-p', '/System/Library/Keychains/SystemRootCertificates.keychain']);
    writeFileSync(join(dir, 'roots.pem'), pem);
    return { caFile: join(dir, 'roots.pem'), cleanup: () => rmSync(dir, { recursive: true, force: true }) };
  }
  return { caFile: '/etc/ssl/certs/ca-certificates.crt', cleanup: () => {} };
}

/**
 * Anchor the org's current head with every TSA. `send: false` is a dry run: it prints nothing,
 * sends nothing, and returns the imprint that would be sent.
 */
export async function anchorHead(db, { orgId, tsas, now = () => new Date(), serverTimestamp, send = true }) {
  const { head } = await readEvidenceChain(db, orgId);
  if (!head) return { status: 'empty-chain' };
  const record = { orgId, blockIndex: head.blockIndex, eventHash: head.eventHash };
  const imprint = anchorImprint(record);
  const ref = db.collection(ANCHOR_COLLECTION).doc(anchorDocId(orgId, head.blockIndex));
  if ((await ref.get()).exists) return { status: 'already-anchored', ...record, imprint };
  if (!send) return { status: 'dry-run', ...record, imprint, tsas: tsas.map((t) => t.url) };

  const tokens = {};
  const failures = [];
  for (const tsa of tsas) {
    try {
      const queryDer = makeQuery(imprint);
      const replyDer = Buffer.from(await tsa.post(queryDer));
      const v = verifyReply({ queryDer, replyDer, caFile: tsa.caFile, vendor: tsa.vendor, now: now() });
      if (!v.ok) throw new Error(v.error);
      tokens[tsa.id] = { url: tsa.url, genTime: v.genTime, serial: v.serial, policy: v.policy, chain: v.chain, replyDer: replyDer.toString('base64') };
    } catch (e) {
      failures.push(`${tsa.id}: ${e.message}`);
    }
  }
  if (failures.length) throw new Error(`anchor refused, nothing stored: ${failures.join('; ')}`);

  await db.runTransaction(async (tx) => {
    tx.create(ref, { ...record, imprint, tokens, anchoredAt: serverTimestamp() });
  });
  return { status: 'anchored', ...record, imprint, tokens: Object.fromEntries(Object.entries(tokens).map(([k, v]) => [k, v.genTime])) };
}
