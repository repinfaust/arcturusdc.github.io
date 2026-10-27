/**
 * Orbit API: Alerts
 * GET /api/orbit/alerts - Get alerts for a user
 */

import { NextResponse } from 'next/server';
import { getUserAlerts } from '@/lib/orbit/db-admin';
import { verifySession } from '@/lib/orbit/auth';
import { canReadUserRecords } from '@/lib/orbit/owner';

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

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (!canReadUserRecords(session, userId)) {
      return NextResponse.json({ error: 'Not permitted to read this user' }, { status: 403 });
    }

    const alerts = await getUserAlerts(userId);
    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

