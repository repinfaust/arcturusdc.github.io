import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { createTenantAdmin } from '@/lib/tenantUtils-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * Get pending workspace details
 * GET /api/claim-workspace?token=...
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const pendingWorkspaceRef = adminDb.collection('pendingWorkspaces').doc(token);
    const pendingWorkspaceDoc = await pendingWorkspaceRef.get();

    if (!pendingWorkspaceDoc.exists) {
      return NextResponse.json(
        { error: 'Invalid or expired claim token' },
        { status: 404 }
      );
    }

    const pendingWorkspace = pendingWorkspaceDoc.data();

    // Check if expired
    if (pendingWorkspace.expiresAt?.toDate() < new Date()) {
      return NextResponse.json(
        { error: 'Claim token has expired' },
        { status: 410 }
      );
    }

    // Check if already claimed
    if (pendingWorkspace.status !== 'pending_claim') {
      return NextResponse.json(
        { error: 'This workspace has already been claimed' },
        { status: 409 }
      );
    }

    return NextResponse.json({
      workspaceName: pendingWorkspace.workspaceName,
      googleEmail: pendingWorkspace.googleEmail,
      plan: pendingWorkspace.plan,
    });
  } catch (error) {
    console.error('Error fetching pending workspace:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspace details', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Claim workspace after Google sign-in validation
 * POST /api/claim-workspace
 * Body: { token, userEmail }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { token, userEmail } = body;

    if (!token || !userEmail) {
      return NextResponse.json(
        { error: 'Token and userEmail are required' },
        { status: 400 }
      );
    }

    // Get pending workspace
    const pendingWorkspaceRef = adminDb.collection('pendingWorkspaces').doc(token);
    const pendingWorkspaceDoc = await pendingWorkspaceRef.get();

    if (!pendingWorkspaceDoc.exists) {
      return NextResponse.json(
        { error: 'Invalid or expired claim token' },
        { status: 404 }
      );
    }

    const pendingWorkspace = pendingWorkspaceDoc.data();

    // Check if expired
    if (pendingWorkspace.expiresAt?.toDate() < new Date()) {
      return NextResponse.json(
        { error: 'Claim token has expired. Please contact support.' },
        { status: 410 }
      );
    }

    // Check if already claimed
    if (pendingWorkspace.status !== 'pending_claim') {
      return NextResponse.json(
        { error: 'This workspace has already been claimed' },
        { status: 409 }
      );
    }

    // Validate email matches
    const normalizedUserEmail = userEmail.toLowerCase().trim();
    const normalizedGoogleEmail = pendingWorkspace.googleEmail.toLowerCase().trim();

    if (normalizedUserEmail !== normalizedGoogleEmail) {
      return NextResponse.json(
        { 
          error: 'Email mismatch',
          expectedEmail: pendingWorkspace.googleEmail,
          message: `Please sign in with ${pendingWorkspace.googleEmail} (the email you used at checkout).`
        },
        { status: 403 }
      );
    }

    // Map plan format (solo-monthly -> solo, team-monthly -> team, etc.)
    const planMap = {
      'solo-monthly': 'solo',
      'solo-yearly': 'solo',
      'team-monthly': 'team',
      'team-yearly': 'team',
      'agency-monthly': 'agency',
      'agency-yearly': 'agency',
    };
    const plan = planMap[pendingWorkspace.plan] || 'team';

    // Create actual workspace/tenant
    const tenant = await createTenantAdmin({
      name: pendingWorkspace.workspaceName,
      plan: plan,
      ownerEmail: normalizedUserEmail,
    });

    // Update subscription with workspace ID
    if (pendingWorkspace.stripeSessionId) {
      const subscriptionQuery = await adminDb
        .collection('stea_subscriptions')
        .where('sessionId', '==', pendingWorkspace.stripeSessionId)
        .limit(1)
        .get();

      if (!subscriptionQuery.empty) {
        const subscriptionDoc = subscriptionQuery.docs[0];
        await subscriptionDoc.ref.update({
          workspaceId: tenant.id,
          status: 'active',
          updatedAt: new Date(),
        });
      }
    }

    // Mark pending workspace as claimed
    await pendingWorkspaceRef.update({
      status: 'claimed',
      claimedAt: new Date(),
      workspaceId: tenant.id,
    });

    return NextResponse.json({
      success: true,
      workspaceId: tenant.id,
      workspaceName: tenant.name,
    });
  } catch (error) {
    console.error('Error claiming workspace:', error);
    return NextResponse.json(
      { error: 'Failed to claim workspace', details: error.message },
      { status: 500 }
    );
  }
}

