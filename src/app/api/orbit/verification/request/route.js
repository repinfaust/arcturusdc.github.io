/**
 * Orbit API: Verification Routing
 * POST /api/orbit/verification/request - Request a verification
 */

import { NextResponse } from 'next/server';
import { addLedgerEvent, getOrg } from '@/lib/orbit/db-admin';
import { signEvent } from '@/lib/orbit/signatures';
import { generateEventId } from '@/lib/orbit/eventTypes';
import { verifySession } from '@/lib/orbit/auth';

// Authenticate org request
async function authenticateOrg(request) {
  const orgId = request.headers.get('X-Orbit-Org-Id');
  const apiKey = request.headers.get('X-Orbit-Api-Key');

  if (!orgId || !apiKey) {
    return { authenticated: false, error: 'Missing X-Orbit-Org-Id or X-Orbit-Api-Key headers' };
  }

  const org = await getOrg(orgId);
  if (!org || org.apiKey !== apiKey) {
    return { authenticated: false, error: 'Invalid org credentials' };
  }

  return { authenticated: true, org };
}

// Mock verifier (PoC)
async function mockVerifier(claimId, userId) {
  // Simulate verification delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock responses based on claim type
  const mockResults = {
    verified_address: 'approved',
    verified_kyc: 'approved',
    verified_identity: 'approved',
  };

  return mockResults[claimId] || 'pending';
}

export async function POST(request) {
  try {
    // Verify user session first
    const session = await verifySession(request);
    if (!session.authenticated) {
      return NextResponse.json(
        { error: session.error || 'Authentication required' },
        { status: 401 }
      );
    }

    // Authenticate org
    const auth = await authenticateOrg(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await request.json();
    const { org } = auth;
    const { userId, claimId, requiredScope, purpose } = body;

    if (!userId || !claimId) {
      return NextResponse.json(
        { error: 'userId and claimId are required' },
        { status: 400 }
      );
    }

    // Resolve verifier (PoC: hardcoded to experian for most claims)
    const verifierOrgId = 'experian'; // In production, lookup from verification_routes config
    const verifierOrg = await getOrg(verifierOrgId);
    if (!verifierOrg) {
      return NextResponse.json(
        { error: `Verifier org ${verifierOrgId} not found` },
        { status: 404 }
      );
    }

    // Create VERIFICATION_REQUESTED event
    const requestEvent = {
      eventId: generateEventId(),
      eventType: 'VERIFICATION_REQUESTED',
      userId,
      orgId: org.orgId,
      recipientOrgId: verifierOrgId,
      verificationClaim: claimId,
      purpose: purpose || 'general',
      signingKeyId: `org-${org.orgId}-key-1`,
    };

    requestEvent.signature = signEvent(requestEvent, org.signingSecret);
    
    // Get previous event for hash chain
    try {
      const { getLatestEvent } = await import('@/lib/orbit/db-admin');
      const { hashEvent } = await import('@/lib/orbit/signatures');
      const previousEvent = await getLatestEvent(userId, org.orgId);
      if (previousEvent && previousEvent.eventHash) {
        requestEvent.previousEventHash = previousEvent.eventHash;
        requestEvent.blockIndex = (previousEvent.blockIndex || 0) + 1;
      } else {
        requestEvent.blockIndex = 1;
      }
      const computedHash = hashEvent(requestEvent);
      if (computedHash) {
        requestEvent.eventHash = computedHash;
      }
    } catch (error) {
      console.error('Error setting up hash chain for verification request:', error);
      requestEvent.blockIndex = 1;
    }
    
    await addLedgerEvent(requestEvent);

    // Call verifier (mock for PoC)
    const verificationResult = await mockVerifier(claimId, userId);

    // Create VERIFICATION_RESPONDED event
    const responseEvent = {
      eventId: generateEventId(),
      eventType: 'VERIFICATION_RESPONDED',
      userId,
      orgId: verifierOrgId,
      recipientOrgId: org.orgId,
      verificationClaim: claimId,
      verificationResult,
      signingKeyId: `org-${verifierOrgId}-key-1`,
    };

    responseEvent.signature = signEvent(responseEvent, verifierOrg.signingSecret);
    
    // Get previous event for hash chain
    try {
      const { getLatestEvent } = await import('@/lib/orbit/db-admin');
      const { hashEvent } = await import('@/lib/orbit/signatures');
      const previousEvent = await getLatestEvent(userId, verifierOrgId);
      if (previousEvent && previousEvent.eventHash) {
        responseEvent.previousEventHash = previousEvent.eventHash;
        responseEvent.blockIndex = (previousEvent.blockIndex || 0) + 1;
      } else {
        responseEvent.blockIndex = 1;
      }
      const computedHash = hashEvent(responseEvent);
      if (computedHash) {
        responseEvent.eventHash = computedHash;
      }
    } catch (error) {
      console.error('Error setting up hash chain for verification response:', error);
      responseEvent.blockIndex = 1;
    }
    
    await addLedgerEvent(responseEvent);

    return NextResponse.json({
      success: true,
      result: verificationResult,
      requestEventId: requestEvent.eventId,
      responseEventId: responseEvent.eventId,
    });
  } catch (error) {
    console.error('Error processing verification:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Failed to process verification',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

