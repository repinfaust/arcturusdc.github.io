import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';

/**
 * GET /api/hans/getByToken?token=xxx
 *
 * Public endpoint - no authentication required
 * Fetch a test case by its public token for external testers
 */
export async function GET(request) {
  try {
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
