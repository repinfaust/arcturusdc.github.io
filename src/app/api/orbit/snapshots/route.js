/**
 * Orbit API: Snapshot Management
 * POST /api/orbit/snapshots - Create or update a snapshot
 * GET /api/orbit/snapshots - Get snapshot by pointer or latest for user/org
 */

import { NextResponse } from 'next/server';
import { createSnapshot, getSnapshot, getLatestSnapshot } from '@/lib/orbit/db';
import { hashSnapshot, signEvent } from '@/lib/orbit/signatures';
import { addLedgerEvent, getOrg } from '@/lib/orbit/db';
import { generateEventId } from '@/lib/orbit/eventTypes';

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
    // Authenticate
    const auth = await authenticateOrg(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await request.json();
    const { org } = auth;
    const { userId, data, scopes } = body;

    if (!userId || !data || !scopes) {
      return NextResponse.json(
        { error: 'userId, data, and scopes are required' },
        { status: 400 }
      );
    }

    // Get latest snapshot to determine version
    const latest = await getLatestSnapshot(userId, org.orgId);
    const version = latest ? latest.version + 1 : 1;
    const snapshotId = `${org.orgId}_v${version}`;

    // Compute hash
    const snapshotHash = hashSnapshot(data);

    // Create snapshot
    const snapshotData = {
      snapshotId,
      userId,
      orgId: org.orgId,
      version,
      data,
      createdBy: org.orgId,
    };

    const docId = await createSnapshot(snapshotData);

    // Create ledger event
    const eventType = version === 1 ? 'PROFILE_REGISTERED' : 'PROFILE_UPDATED';
    const event = {
      eventId: generateEventId(),
      eventType,
      userId,
      orgId: org.orgId,
      snapshotPointer: snapshotId,
      snapshotHash,
      hashAlgorithm: 'SHA-256',
      scopes: Array.isArray(scopes) ? scopes : [scopes],
      signingKeyId: `org-${org.orgId}-key-1`,
    };

    event.signature = signEvent(event, org.signingSecret);
    await addLedgerEvent(event);

    return NextResponse.json({
      success: true,
      snapshot: {
        id: docId,
        snapshotId,
        version,
        snapshotHash,
      },
    });
  } catch (error) {
    console.error('Error creating snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to create snapshot' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const snapshotPointer = searchParams.get('snapshotPointer');
    const userId = searchParams.get('userId');
    const orgId = searchParams.get('orgId');

    if (snapshotPointer) {
      const snapshot = await getSnapshot(snapshotPointer);
      if (!snapshot) {
        return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
      }
      return NextResponse.json({ snapshot });
    }

    if (userId && orgId) {
      const snapshot = await getLatestSnapshot(userId, orgId);
      if (!snapshot) {
        return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
      }
      return NextResponse.json({ snapshot });
    }

    return NextResponse.json(
      { error: 'Either snapshotPointer or (userId and orgId) required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to fetch snapshot' },
      { status: 500 }
    );
  }
}

