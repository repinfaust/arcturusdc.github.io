import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { randomBytes } from 'crypto';

const SESSION_COOKIE_NAME = '__session';

/**
 * Verify user authentication via session cookie
 */
async function verifyAuth(request) {
  try {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return { authenticated: false, error: 'No session cookie found' };
    }

    const { auth } = getFirebaseAdmin();
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

    return {
      authenticated: true,
      uid: decodedClaims.uid,
      email: decodedClaims.email,
    };
  } catch (error) {
    return {
      authenticated: false,
      error: 'Invalid or expired session',
    };
  }
}

/**
 * Generate a secure public token for test case sharing
 */
function generatePublicToken() {
  return randomBytes(16).toString('hex'); // 32 character hex string
}

/**
 * POST /api/hans/createFromCard
 *
 * Create a test case in Hans from a Filo card
 */
export async function POST(request) {
  try {
    // 1. Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const {
      cardId,
      boardId,
      app,
      title,
      description,
      userStory,
      acceptanceCriteria,
      userFlow,
      priority,
      epicId,
      featureId,
      epicLabel,
      featureLabel,
      tenantId, // SECURITY: Must be provided by client
    } = body;

    // 3. Validate required fields
    if (!cardId) {
      return NextResponse.json(
        { error: 'Missing required field: cardId' },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: 'Missing required field: title' },
        { status: 400 }
      );
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing required field: tenantId' },
        { status: 400 }
      );
    }

    // SECURITY: Verify the card exists and belongs to the specified tenant
    const { db } = getFirebaseAdmin();
    const cardDoc = await db.collection('stea_cards').doc(cardId).get();

    if (!cardDoc.exists) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }

    if (cardDoc.data().tenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized: Card does not belong to your workspace' },
        { status: 403 }
      );
    }

    // 4. Check if test case already exists for this card
    const existingCases = await db
      .collection('hans_cases')
      .where('linkedCardId', '==', cardId)
      .limit(1)
      .get();

    if (!existingCases.empty) {
      const existingCase = existingCases.docs[0];
      return NextResponse.json(
        {
          error: 'Test case already exists for this card',
          testCaseId: existingCase.id,
        },
        { status: 409 }
      );
    }

    // 5. Generate public token for sharing
    const publicToken = generatePublicToken();

    // Calculate expiry (12 hours from now)
    const now = new Date();
    const expiryDate = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours

    // 6. Create test case document
    const testCase = {
      // Content from card
      app: app || 'New App',
      title: title || 'Untitled Test Case',
      description: description || '',
      userStory: userStory || '',
      acceptanceCriteria: Array.isArray(acceptanceCriteria) ? acceptanceCriteria : [],
      userFlow: Array.isArray(userFlow) ? userFlow : [],
      priority: priority || 'medium',

      // Linkage to Filo
      linkedCardId: cardId,
      linkedBoardId: boardId || 'main',
      linkedFeatureId: featureId || null,
      linkedEpicId: epicId || null,
      linkedFeatureLabel: featureLabel || null,
      linkedEpicLabel: epicLabel || null,

      // Testing metadata
      status: 'open', // open | in_progress | passed | failed
      publicToken: publicToken,
      publicTokenExpiry: expiryDate.toISOString(),

      // SECURITY: Store tenant ID for isolation
      tenantId: tenantId,

      // Audit fields
      createdAt: new Date().toISOString(),
      createdBy: authResult.email || authResult.uid,
      updatedAt: new Date().toISOString(),
    };

    const testCaseRef = await db.collection('hans_cases').add(testCase);
    const testCaseId = testCaseRef.id;

    // 7. Update the source card with test case link
    try {
      await db.collection('stea_cards').doc(cardId).update({
        'testing.testCaseId': testCaseId,
        'testing.status': 'pending',
        'testing.createdAt': new Date().toISOString(),
        'testing.publicToken': publicToken,
        updatedAt: new Date().toISOString(),
      });
    } catch (updateError) {
      console.error('Failed to update card with test case link:', updateError);
      // Don't fail the whole operation if card update fails
      // The test case is created, user can still use it
    }

    // 8. Return success response
    return NextResponse.json(
      {
        success: true,
        testCaseId,
        publicToken,
        publicTokenExpiry: expiryDate.toISOString(),
        publicUrl: `/t/${publicToken}`,
        hansUrl: `/apps/stea/hans?case=${testCaseId}`,
        message: 'Test case created. Public link expires in 12 hours.',
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating test case:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
