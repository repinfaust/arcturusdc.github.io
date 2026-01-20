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

    let deleteCount = 0;
    const BATCH_SIZE = 500; // Firestore batch limit

    // Helper function to delete documents in batches
    async function deleteInBatches(query, collectionName) {
      const snapshot = await query.get();
      const docs = snapshot.docs;
      let count = 0;

      // Process in batches of 500
      for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const batchDocs = docs.slice(i, i + BATCH_SIZE);
        
        batchDocs.forEach(doc => {
          batch.delete(doc.ref);
          count++;
        });

        await batch.commit();
      }

      return count;
    }

    // Delete all events for this user
    const eventsRef = db.collection(COLLECTIONS.LEDGER_EVENTS);
    const eventsQuery = eventsRef.where('userId', '==', userId);
    deleteCount += await deleteInBatches(eventsQuery, COLLECTIONS.LEDGER_EVENTS);

    // Delete all alerts for this user
    const alertsRef = db.collection(COLLECTIONS.ALERTS);
    const alertsQuery = alertsRef.where('userId', '==', userId);
    deleteCount += await deleteInBatches(alertsQuery, COLLECTIONS.ALERTS);

    // Delete all consent state for this user
    const consentRef = db.collection(COLLECTIONS.CONSENT_STATE);
    const consentQuery = consentRef.where('userId', '==', userId);
    deleteCount += await deleteInBatches(consentQuery, COLLECTIONS.CONSENT_STATE);

    // Delete all snapshots for this user
    const snapshotsRef = db.collection(COLLECTIONS.SNAPSHOTS);
    const snapshotsQuery = snapshotsRef.where('userId', '==', userId);
    deleteCount += await deleteInBatches(snapshotsQuery, COLLECTIONS.SNAPSHOTS);

    // Optionally delete demo orgs
    if (deleteOrgs) {
      const orgsRef = db.collection(COLLECTIONS.ORGS);
      const demoOrgIds = ['experian', 'challenger_bank', 'broker_app', 'healthcare_provider'];
      for (const orgId of demoOrgIds) {
        const orgQuery = orgsRef.where('orgId', '==', orgId);
        deleteCount += await deleteInBatches(orgQuery, COLLECTIONS.ORGS);
      }
    }

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

