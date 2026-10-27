/**
 * Orbit API: Organisation Management
 * POST /api/orbit/orgs - Create or update an organisation
 * GET /api/orbit/orgs - List all organisations
 * Logic: src/lib/orbit/handlers/orgs.js (D-SITE-047)
 */

import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { upsertOrg, getAllOrgs, getOrg } from '@/lib/orbit/db-admin';
import { verifySession } from '@/lib/orbit/auth';
import { makeOrgsHandlers } from '@/lib/orbit/handlers/orgs';

export const { POST, GET } = makeOrgsHandlers({
  verifySession,
  getOrg,
  getAllOrgs,
  upsertOrg,
  now: () => new Date(),
  toTimestamp: (date) => Timestamp.fromDate(date),
  json: (body, init) => NextResponse.json(body, init),
});
