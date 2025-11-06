import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rateLimit';

/**
 * POST /api/hans/submitResults
 *
 * Public endpoint - no authentication required
 * Submit test results from external testers
 */
export async function POST(request) {
  try {
    // 1. Rate limiting
    const clientId = getClientIdentifier(request);
    const { allowed, remaining, resetAt } = checkRateLimit(
      `hans-submit-${clientId}`,
      RATE_LIMITS.publicTestSubmit.maxRequests,
      RATE_LIMITS.publicTestSubmit.windowMs
    );

    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Too many submissions. Please try again later.',
          resetAt: new Date(resetAt).toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(RATE_LIMITS.publicTestSubmit.maxRequests),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(Math.floor(resetAt / 1000)),
          },
        }
      );
    }

    const body = await request.json();
    const {
      token,
      testerName,
      testerEmail,
      platform,
      buildVersion,
      criteriaResults,
      overallStatus,
      feedback,
    } = body;

    // Validate required fields
    if (!token) {
      return NextResponse.json(
        { error: 'Missing required field: token' },
        { status: 400 }
      );
    }

    if (!overallStatus || !['passed', 'failed'].includes(overallStatus)) {
      return NextResponse.json(
        { error: 'Invalid overallStatus. Must be "passed" or "failed"' },
        { status: 400 }
      );
    }

    // Find test case by token
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

    const testCaseDoc = snapshot.docs[0];
    const testCaseId = testCaseDoc.id;

    // Create submission document
    const submission = {
      testerName: testerName || 'Anonymous',
      testerEmail: testerEmail || null,
      platform: platform || null,
      buildVersion: buildVersion || null,
      criteriaResults: Array.isArray(criteriaResults) ? criteriaResults : [],
      overallStatus,
      feedback: feedback || '',
      submittedAt: new Date().toISOString(),
    };

    // Add submission to subcollection
    const submissionRef = await db
      .collection('hans_cases')
      .doc(testCaseId)
      .collection('submissions')
      .add(submission);

    // Update test case status if it's currently 'open'
    const currentStatus = testCaseDoc.data().status;
    if (currentStatus === 'open') {
      await db.collection('hans_cases').doc(testCaseId).update({
        status: 'in_progress',
        updatedAt: new Date().toISOString(),
      });
    }

    // Optionally update linked card in stea_cards
    // SECURITY: Verify the test case has a tenantId before updating the card
    const linkedCardId = testCaseDoc.data().linkedCardId;
    const testCaseTenantId = testCaseDoc.data().tenantId;

    if (linkedCardId && testCaseTenantId) {
      try {
        const cardRef = db.collection('stea_cards').doc(linkedCardId);
        const cardDoc = await cardRef.get();

        // SECURITY: Only update card if it belongs to the same tenant as the test case
        if (cardDoc.exists() && cardDoc.data().tenantId === testCaseTenantId) {
          // Get all submissions to calculate stats
          const allSubmissions = await db
            .collection('hans_cases')
            .doc(testCaseId)
            .collection('submissions')
            .get();

          const totalSubmissions = allSubmissions.size;
          const passedSubmissions = allSubmissions.docs.filter(
            doc => doc.data().overallStatus === 'passed'
          ).length;
          const passRate = totalSubmissions > 0
            ? Math.round((passedSubmissions / totalSubmissions) * 100)
            : 0;

          await cardRef.update({
            'testing.status': overallStatus === 'passed' ? 'passed' : 'needs_attention',
            'testing.lastSubmissionAt': new Date().toISOString(),
            'testing.totalSubmissions': totalSubmissions,
            'testing.passRate': passRate,
            updatedAt: new Date().toISOString(),
          });
        } else {
          console.warn('Card tenant mismatch or card not found - skipping update');
        }
      } catch (cardUpdateError) {
        console.error('Failed to update linked card:', cardUpdateError);
        // Don't fail the submission if card update fails
      }
    }

    return NextResponse.json(
      {
        success: true,
        submissionId: submissionRef.id,
        message: 'Thank you! Your test results have been submitted.',
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error submitting test results:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
