/**
 * Orbit API: Ledger Events
 * POST /api/orbit/events - Create a ledger event
 * GET /api/orbit/events - Query ledger events
 */

import { NextResponse } from 'next/server';
import { addLedgerEvent, getUserEvents, getOrg, updateConsentState } from '@/lib/orbit/db-admin';
import { validateEvent, generateEventId } from '@/lib/orbit/eventTypes';
import { signEvent } from '@/lib/orbit/signatures';
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

    // Add to ledger
    const docId = await addLedgerEvent(event);

    // Update consent state if consent event
    if (body.eventType === 'CONSENT_GRANTED' || body.eventType === 'CONSENT_REVOKED') {
      await updateConsentState(
        body.userId,
        body.orgId,
        body.consentScope,
        body.consentStatus
      );
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
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
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

