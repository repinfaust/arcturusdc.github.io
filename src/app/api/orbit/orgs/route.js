/**
 * Orbit API: Organisation Management
 * POST /api/orbit/orgs - Create or update an organisation
 * GET /api/orbit/orgs - List all organisations
 */

import { NextResponse } from 'next/server';
import { upsertOrg, getAllOrgs, getOrg } from '@/lib/orbit/db-admin';
import crypto from 'crypto';

// Generate API key and signing secret
function generateCredentials() {
  const apiKey = `org_${crypto.randomBytes(16).toString('hex')}`;
  const signingSecret = crypto.randomBytes(32).toString('hex');
  return { apiKey, signingSecret };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { orgId, displayName, scopes } = body;

    if (!orgId || !displayName) {
      return NextResponse.json(
        { error: 'orgId and displayName are required' },
        { status: 400 }
      );
    }

    // Check if org exists
    const existing = await getOrg(orgId);
    const credentials = existing 
      ? { apiKey: existing.apiKey, signingSecret: existing.signingSecret }
      : generateCredentials();

    const orgData = {
      orgId,
      displayName,
      apiKey: credentials.apiKey,
      signingSecret: credentials.signingSecret,
      scopes: scopes || {},
      isSandbox: body.isSandbox !== false, // Default to sandbox for PoC
    };

    const docId = await upsertOrg(orgData);

    return NextResponse.json({
      success: true,
      org: {
        id: docId,
        orgId,
        displayName,
        apiKey: credentials.apiKey,
        signingSecret: existing ? '[REDACTED]' : credentials.signingSecret, // Only show on creation
        scopes: orgData.scopes,
      },
    });
  } catch (error) {
    console.error('Error creating/updating org:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to create/update organisation', details: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (orgId) {
      const org = await getOrg(orgId);
      if (!org) {
        return NextResponse.json({ error: 'Organisation not found' }, { status: 404 });
      }
      // Don't expose signing secrets
      const { signingSecret, ...safeOrg } = org;
      return NextResponse.json({ org: safeOrg });
    }

    const orgs = await getAllOrgs();
    const safeOrgs = orgs.map(org => {
      const { signingSecret, ...safe } = org;
      return safe;
    });

    return NextResponse.json({ orgs: safeOrgs });
  } catch (error) {
    console.error('Error fetching orgs:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to fetch organisations', details: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined },
      { status: 500 }
    );
  }
}

