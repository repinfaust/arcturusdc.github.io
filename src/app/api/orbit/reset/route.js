/**
 * Orbit API: Reset Sandbox
 * POST /api/orbit/reset - Delete all demo data for a user. Owner-only (D-SITE-046).
 * Logic: src/lib/orbit/handlers/reset.js
 */

import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { verifySession } from '@/lib/orbit/auth';
import { makeResetHandler } from '@/lib/orbit/handlers/reset';

export const POST = makeResetHandler({
  verifySession,
  getDb: () => getFirebaseAdmin().db,
  json: (body, init) => NextResponse.json(body, init),
});
