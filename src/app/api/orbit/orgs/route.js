/**
 * Orbit API: Organisation Management
 * POST /api/orbit/orgs - Create or update an organisation
 * GET /api/orbit/orgs - List all organisations
 */

import { NextResponse } from 'next/server';
import { upsertOrg, getAllOrgs, getOrg } from '@/lib/orbit/db-admin';
import { verifySession } from '@/lib/orbit/auth';
import { Timestamp } from 'firebase-admin/firestore';
import crypto from 'crypto';

// Generate API key and signing secret
// For demo/PoC: Use deterministic secrets for consistency (same orgId = same secret)
// In production, these would be truly random and stored securely
function generateCredentials(orgId) {
  // For PoC: Use deterministic secrets based on orgId for consistency
  // This ensures that resetting and re-seeding doesn't break signature verification
  const demoSecrets = {
    'experian': {
      apiKey: 'org_demo_experian_12345',
      signingSecret: 'demo_secret_experian_' + 'a'.repeat(32), // 32 chars for HMAC-SHA256
    },
    'challenger_bank': {
      apiKey: 'org_demo_challenger_12345',
      signingSecret: 'demo_secret_challenger_' + 'b'.repeat(32),
    },
    'broker_app': {
      apiKey: 'org_demo_broker_12345',
      signingSecret: 'demo_secret_broker_' + 'c'.repeat(32),
    },
    'healthcare_provider': {
      apiKey: 'org_demo_healthcare_12345',
      signingSecret: 'demo_secret_healthcare_' + 'd'.repeat(32),
    },
  };

  // Use deterministic secrets for demo orgs, random for others
  if (demoSecrets[orgId]) {
    return demoSecrets[orgId];
  }

  // For non-demo orgs, use random secrets
  const apiKey = `org_${crypto.randomBytes(16).toString('hex')}`;
  const signingSecret = crypto.randomBytes(32).toString('hex');
  return { apiKey, signingSecret };
}

export async function POST(request) {
  try {
    // Verify session
    const session = await verifySession(request);
    if (!session.authenticated) {
      return NextResponse.json(
        { error: session.error || 'Authentication required' },
        { status: 401 }
      );
    }

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
      : generateCredentials(orgId);

    // Set key expiration to 90 days from now (signatures expire unless re-keyed)
    const keyExpiresAt = new Date();
    keyExpiresAt.setDate(keyExpiresAt.getDate() + 90);
    
    // Convert to Firestore Timestamp
    const keyExpiresAtTimestamp = Timestamp.fromDate(keyExpiresAt);

    const orgData = {
      orgId,
      displayName,
      apiKey: credentials.apiKey,
      signingSecret: credentials.signingSecret,
      scopes: scopes || {},
      isSandbox: body.isSandbox !== false, // Default to sandbox for PoC
      keyExpiresAt: keyExpiresAtTimestamp, // Signature expiration date (Firestore Timestamp)
      signingKeyId: `org-${orgId}-key-1`, // Key version identifier
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
      { 
        error: 'Failed to create/update organisation', 
        details: error.message,
        message: error.message === 'Firebase Admin DB not initialized' 
          ? 'Firebase Admin credentials not configured. Please set FIREBASE_SERVICE_ACCOUNT environment variable.'
          : error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // Verify session
    const session = await verifySession(request);
    if (!session.authenticated) {
      return NextResponse.json(
        { error: session.error || 'Authentication required' },
        { status: 401 }
      );
    }

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
      { 
        error: 'Failed to fetch organisations', 
        details: error.message,
        message: error.message === 'Firebase Admin DB not initialized' 
          ? 'Firebase Admin credentials not configured. Please set FIREBASE_SERVICE_ACCOUNT environment variable.'
          : error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
      },
      { status: 500 }
    );
  }
}

