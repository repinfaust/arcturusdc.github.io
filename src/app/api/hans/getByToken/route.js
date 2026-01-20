import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rateLimit';

/**
 * GET /api/hans/getByToken?token=xxx
 *
 * Public endpoint - no authentication required
 * Fetch a test case by its public token for external testers
 */
export async function GET(request) {
  try {
    // 1. Rate limiting
    const clientId = getClientIdentifier(request);
    const { allowed, remaining, resetAt } = checkRateLimit(
      `hans-get-${clientId}`,
      RATE_LIMITS.publicTestAccess.maxRequests,
      RATE_LIMITS.publicTestAccess.windowMs
    );

    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          resetAt: new Date(resetAt).toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(RATE_LIMITS.publicTestAccess.maxRequests),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(Math.floor(resetAt / 1000)),
          },
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Missing token parameter' },
        { status: 400 }
      );
    }

    // Query for test case with this public token
    const { db } = getFirebaseAdmin();
    const snapshot = await db
      .collection('hans_cases')
      .where('publicToken', '==', token)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'Test case not found' },
        { status: 404 }
      );
    }

    const doc = snapshot.docs[0];
    const testCase = {
      id: doc.id,
      ...doc.data(),
    };

    // 2. Check if token has expired
    if (testCase.publicTokenExpiry) {
      const expiryDate = new Date(testCase.publicTokenExpiry);
      const now = new Date();

      if (now > expiryDate) {
        return NextResponse.json(
          {
            error: 'This test link has expired',
            expiredAt: testCase.publicTokenExpiry,
          },
          { status: 410 } // 410 Gone
        );
      }
    }

    // Return test case (without sensitive fields)
    return NextResponse.json(
      {
        success: true,
        testCase: {
          id: testCase.id,
          app: testCase.app,
          title: testCase.title,
          description: testCase.description,
          userStory: testCase.userStory,
          acceptanceCriteria: testCase.acceptanceCriteria || [],
          userFlow: testCase.userFlow || [],
          priority: testCase.priority,
          status: testCase.status,
          linkedEpicLabel: testCase.linkedEpicLabel,
          linkedFeatureLabel: testCase.linkedFeatureLabel,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error fetching test case by token:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
