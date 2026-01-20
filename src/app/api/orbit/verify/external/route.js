/**
 * Orbit API: External Verifier (Mock)
 * POST /api/orbit/verify/external - Simulate external verification service
 * Demonstrates request-response proof loops
 */

import { NextResponse } from 'next/server';
import { getOrg } from '@/lib/orbit/db-admin';
import { verifyEventSignature, hashEvent } from '@/lib/orbit/signatures';
import { verifySession } from '@/lib/orbit/auth';
import crypto from 'crypto';

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
    const { event } = body;

    if (!event) {
      return NextResponse.json(
        { error: 'event is required' },
        { status: 400 }
      );
    }

    if (!event.orgId) {
      return NextResponse.json(
        { error: 'orgId is required in event' },
        { status: 400 }
      );
    }

    // Get organization to retrieve signing secret
    const org = await getOrg(event.orgId);
    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Simulate external verifier processing
    // In production, this would be a separate service/API
    const verifierName = 'Orbit External Verifier Service v1.0';
    const verifiedAt = new Date().toISOString();

    // Verify event signature
    const signatureValid = verifyEventSignature(event, org.signingSecret);

    // Verify hash chain (if applicable)
    let hashChainValid = true;
    if (event.previousEventHash && event.eventHash) {
      const computedHash = hashEvent(event);
      hashChainValid = computedHash === event.eventHash;
    }

    // Overall verification result
    const verified = signatureValid && hashChainValid;

    // Generate proof token (simulated)
    const proofData = {
      eventId: event.eventId,
      verifiedAt,
      signatureValid,
      hashChainValid,
      verifierName,
    };
    const proof = crypto.createHash('sha256')
      .update(JSON.stringify(proofData))
      .digest('hex');

    return NextResponse.json({
      success: true,
      verified,
      verifierName,
      verifiedAt,
      signatureValid,
      hashChainValid,
      proof: `proof:${proof}`,
      metadata: {
        eventId: event.eventId,
        orgId: event.orgId,
        eventType: event.eventType,
      },
    });
  } catch (error) {
    console.error('Error in external verification:', error);
    return NextResponse.json(
      { error: 'Failed to verify externally', details: error.message },
      { status: 500 }
    );
  }
}

