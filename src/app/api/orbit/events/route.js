/**
 * Orbit API: Ledger Events
 * POST /api/orbit/events - Create a ledger event
 * GET /api/orbit/events - Query ledger events
 */

import { NextResponse } from 'next/server';
import { addLedgerEvent, getUserEvents, getOrg, updateConsentState, getLatestEvent } from '@/lib/orbit/db-admin';
import { validateEvent, generateEventId } from '@/lib/orbit/eventTypes';
import { signEvent, hashEvent } from '@/lib/orbit/signatures';
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

    // Validate event
    const validation = validateEvent(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Ensure orgId matches authenticated org
    if (body.orgId !== org.orgId) {
      return NextResponse.json(
        { error: 'orgId in body must match authenticated org' },
        { status: 403 }
      );
    }

    // Generate event ID and add metadata
    const event = {
      ...body,
      eventId: body.eventId || generateEventId(),
      signingKeyId: `org-${org.orgId}-key-1`,
    };

    // Sign the event
    event.signature = signEvent(event, org.signingSecret);

    // Get previous event for hash chain linking
    try {
      const previousEvent = await getLatestEvent(body.userId, body.orgId);
      if (previousEvent && previousEvent.eventHash) {
        event.previousEventHash = previousEvent.eventHash;
        event.blockIndex = (previousEvent.blockIndex || 0) + 1;
      } else {
        event.blockIndex = 1;
        // Don't set previousEventHash if there's no previous event
      }
    } catch (error) {
      console.error('Error getting latest event for hash chain:', error);
      // Continue without hash chain if it fails
      event.blockIndex = 1;
    }

    // Compute event hash (for hash chain)
    try {
      const computedHash = hashEvent(event);
      if (computedHash) {
        event.eventHash = computedHash;
      }
    } catch (error) {
      console.error('Error computing event hash:', error);
      // Continue without hash if it fails
    }

    // Add to ledger (addLedgerEvent will clean undefined values)
    const docId = await addLedgerEvent(event);

    // Update consent state if consent event
    if (body.eventType === 'CONSENT_GRANTED' || body.eventType === 'CONSENT_REVOKED') {
      try {
        await updateConsentState(
          body.userId,
          body.orgId,
          body.consentScope,
          body.consentStatus || (body.eventType === 'CONSENT_GRANTED' ? 'GRANTED' : 'REVOKED')
        );
      } catch (error) {
        console.error('Error updating consent state:', error);
        // Don't fail the event creation if consent state update fails
      }
    }

    // Run policy engine (async, don't block response)
    import('@/lib/orbit/policyEngine').then(({ checkEventPolicies }) => {
      checkEventPolicies(event).catch(console.error);
    });

    return NextResponse.json({
      success: true,
      event: {
        id: docId,
        eventId: event.eventId,
        eventType: event.eventType,
      },
    });
  } catch (error) {
    console.error('Error creating event:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Failed to create event',
        details: error.message,
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
    const userId = searchParams.get('userId');
    const orgId = searchParams.get('orgId');
    const eventType = searchParams.get('eventType');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const events = await getUserEvents(userId, { orgId, eventType });
    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

