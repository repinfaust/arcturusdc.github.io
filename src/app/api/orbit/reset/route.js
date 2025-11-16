/**
 * Orbit API: Reset Sandbox
 * POST /api/orbit/reset - Delete all demo data for a user
 */

import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { verifySession } from '@/lib/orbit/auth';
import { COLLECTIONS } from '@/lib/orbit/db-admin';

const DEMO_USER_ID = 'user_12345';

export async function POST(request) {
  try {
    // Verify session
    const session = await verifySession(request);
    if (!session.authenticated) {
      return NextResponse.json(
        { error: session.error || 'Authentication required' },
        { status: 401 }
      );
    }

    const { db } = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const userId = body.userId || DEMO_USER_ID;
    const deleteOrgs = body.deleteOrgs || false; // Option to delete orgs too

    const batch = db.batch();
    let deleteCount = 0;

    // Delete all events for this user
    const eventsRef = db.collection(COLLECTIONS.LEDGER_EVENTS);
    const eventsSnapshot = await eventsRef.where('userId', '==', userId).get();
    eventsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
      deleteCount++;
    });

    // Delete all alerts for this user
    const alertsRef = db.collection(COLLECTIONS.ALERTS);
    const alertsSnapshot = await alertsRef.where('userId', '==', userId).get();
    alertsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
      deleteCount++;
    });

    // Delete all consent state for this user
    const consentRef = db.collection(COLLECTIONS.CONSENT_STATE);
    const consentSnapshot = await consentRef.where('userId', '==', userId).get();
    consentSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
      deleteCount++;
    });

    // Delete all snapshots for this user
    const snapshotsRef = db.collection(COLLECTIONS.SNAPSHOTS);
    const snapshotsSnapshot = await snapshotsRef.where('userId', '==', userId).get();
    snapshotsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
      deleteCount++;
    });

    // Optionally delete demo orgs
    if (deleteOrgs) {
      const orgsRef = db.collection(COLLECTIONS.ORGS);
      const demoOrgIds = ['experian', 'challenger_bank', 'broker_app', 'healthcare_provider'];
      for (const orgId of demoOrgIds) {
        const orgSnapshot = await orgsRef.where('orgId', '==', orgId).get();
        orgSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
          deleteCount++;
        });
      }
    }

    // Commit the batch delete
    await batch.commit();

    return NextResponse.json({
      success: true,
      deleted: deleteCount,
      message: `Deleted ${deleteCount} documents for user ${userId}`,
    });
  } catch (error) {
    console.error('Error resetting sandbox:', error);
    return NextResponse.json(
      { error: 'Failed to reset sandbox', details: error.message },
      { status: 500 }
    );
  }
}

