/**
 * Orbit API: Cryptographic Verification
 * POST /api/orbit/verify - Verify event signature, snapshot hash, and hash chain
 */

import { NextResponse } from 'next/server';
import { getOrg, getSnapshot } from '@/lib/orbit/db-admin';
import { verifyEventSignature, verifySnapshotHash, hashEvent, hashSnapshot } from '@/lib/orbit/signatures';
import { verifySession } from '@/lib/orbit/auth';

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
    const { eventId, event, snapshotPointer, simulateTampering } = body;

    if (!event && !eventId) {
      return NextResponse.json(
        { error: 'event or eventId is required' },
        { status: 400 }
      );
    }

    // If eventId provided, fetch event (for now, we'll use the event object passed)
    // In production, you'd fetch from database
    const eventToVerify = event || {};

    // Get organization to retrieve signing secret
    if (!eventToVerify.orgId) {
      return NextResponse.json(
        { error: 'orgId is required in event' },
        { status: 400 }
      );
    }

    const org = await getOrg(eventToVerify.orgId);
    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const results = {
      eventSignature: null,
      snapshotHash: null,
      hashChain: null,
    };

    // 1. Verify event signature
    if (eventToVerify.signature) {
      // Create a clean copy of the event for verification
      // This ensures we're verifying against the same data that was signed
      let eventForVerification = { ...eventToVerify };
      
      // Simulate tampering if requested (for demo)
      if (simulateTampering) {
        eventForVerification.eventType = 'TAMPERED_' + eventForVerification.eventType;
      }

      // Verify the signature
      // Note: verifyEventSignature will clean the event the same way signEvent does
      const isValid = verifyEventSignature(eventForVerification, org.signingSecret);
      results.eventSignature = {
        signature: eventToVerify.signature,
        verified: isValid,
        method: 'HMAC-SHA256',
      };
      
      if (!isValid && process.env.NODE_ENV === 'development') {
        console.log('[Verify] Event data for signature verification:', JSON.stringify(eventForVerification, null, 2));
      }
    }

    // 2. Verify snapshot hash (if snapshotPointer provided)
    if (snapshotPointer) {
      const snapshot = await getSnapshot(snapshotPointer);
      if (snapshot) {
        let snapshotData = snapshot.data;
        
        // Simulate tampering if requested (for demo)
        if (simulateTampering) {
          snapshotData = { ...snapshotData, tampered: true };
        }

        const recomputedHash = hashSnapshot(snapshotData);
        const isValid = verifySnapshotHash(snapshotData, snapshot.snapshotHash);
        results.snapshotHash = {
          snapshotHash: snapshot.snapshotHash,
          recomputedHash: recomputedHash,
          verified: isValid,
        };
      }
    }

    // 3. Verify hash chain (if previousEventHash exists)
    if (eventToVerify.previousEventHash && eventToVerify.eventHash) {
      // Recompute the hash using the same method as when the event was created
      // The hash should match the stored eventHash
      // Note: hashEvent will clean the event the same way it was cleaned during creation
      const computedHash = hashEvent(eventToVerify);
      const isValid = computedHash === eventToVerify.eventHash;
      
      // Also verify that the previousEventHash matches the previous event's eventHash
      // (This would require fetching the previous event, but for now we just check the current hash)
      
      if (!isValid && process.env.NODE_ENV === 'development') {
        console.log('[Verify] Hash chain verification failed:');
        console.log('[Verify] Expected hash:', eventToVerify.eventHash);
        console.log('[Verify] Computed hash:', computedHash);
        console.log('[Verify] Event data:', JSON.stringify(eventToVerify, null, 2));
      }
      
      results.hashChain = {
        previousEventHash: eventToVerify.previousEventHash,
        thisEventHash: eventToVerify.eventHash,
        computedHash: computedHash,
        blockIndex: eventToVerify.blockIndex || null,
        verified: isValid,
        note: isValid ? 'Hash chain intact' : 'Hash mismatch - event may have been modified after creation',
      };
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Error verifying:', error);
    return NextResponse.json(
      { error: 'Failed to verify', details: error.message },
      { status: 500 }
    );
  }
}

