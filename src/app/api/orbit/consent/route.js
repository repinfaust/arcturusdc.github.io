/**
 * Orbit API: Consent State
 * GET /api/orbit/consent - Get consent state for a user
 */

import { NextResponse } from 'next/server';
import { getConsentState } from '@/lib/orbit/db-admin';
import { verifySession } from '@/lib/orbit/auth';

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

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const consent = await getConsentState(userId, orgId || null);
    return NextResponse.json({ consent });
  } catch (error) {
    console.error('Error fetching consent state:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consent state' },
      { status: 500 }
    );
  }
}

