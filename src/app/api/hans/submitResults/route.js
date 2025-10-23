import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';

/**
 * POST /api/hans/submitResults
 *
 * Public endpoint - no authentication required
 * Submit test results from external testers
 */
export async function POST(request) {
  try {
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
    const linkedCardId = testCaseDoc.data().linkedCardId;
    if (linkedCardId) {
      try {
        const cardRef = db.collection('stea_cards').doc(linkedCardId);
        const cardDoc = await cardRef.get();

        if (cardDoc.exists()) {
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
