/**
 * Orbit API: Cryptographic Verification
 * POST /api/orbit/verify - chain mode (stored evidence chain, owner only) or the POC's event mode
 * Logic: src/lib/orbit/handlers/verify.js (D-SITE-058)
 */

import { NextResponse } from 'next/server';
import { getOrg, getSnapshot } from '@/lib/orbit/db-admin';
import { verifySession } from '@/lib/orbit/auth';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { readEvidenceChain } from '@/lib/orbit/evidenceStore';
import { makeVerifyHandler } from '@/lib/orbit/handlers/verify';
import { ANCHOR_COLLECTION } from '@/lib/orbit/anchors';

export const POST = makeVerifyHandler({
  verifySession,
  getOrg,
  getSnapshot,
  readChain: (orgId) => readEvidenceChain(getFirebaseAdmin().db, orgId),
  readAnchors: async (orgId) =>
    (await getFirebaseAdmin().db.collection(ANCHOR_COLLECTION).where('orgId', '==', orgId).get()).docs.map((d) => d.data()),
  now: () => new Date(),
  json: (body, init) => NextResponse.json(body, init),
});
