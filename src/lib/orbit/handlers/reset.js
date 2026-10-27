/**
 * POST /api/orbit/reset - Delete the sandbox's demo data (D-SITE-046)
 * Owner-only. Before this, any signed-in user could delete any userId's events, alerts,
 * consent state and snapshots, and the demo orgs.
 * Dependencies are injected so the handler is tested without Firebase or Next.
 */

import { isOrbitOwner } from '../owner.js';
import { COLLECTION_NAMES } from '../collections.js';

const DEMO_USER_ID = 'user_12345';
const DEMO_ORG_IDS = ['experian', 'challenger_bank', 'broker_app', 'healthcare_provider'];
const BATCH_SIZE = 500; // Firestore batch limit

export function makeResetHandler({ verifySession, getDb, json }) {
  return async function POST(request) {
    try {
      const session = await verifySession(request);
      if (!session?.authenticated) {
        return json({ error: session?.error || 'Authentication required' }, { status: 401 });
      }
      if (!isOrbitOwner(session)) {
        return json({ error: 'Only the Orbit owner can reset the sandbox' }, { status: 403 });
      }

      const db = getDb();
      if (!db) {
        return json({ error: 'Database not initialized' }, { status: 500 });
      }

      const body = await request.json();
      const userId = body.userId || DEMO_USER_ID;
      const deleteOrgs = body.deleteOrgs || false;

      async function deleteInBatches(query) {
        const docs = (await query.get()).docs;
        for (let i = 0; i < docs.length; i += BATCH_SIZE) {
          const batch = db.batch();
          docs.slice(i, i + BATCH_SIZE).forEach((doc) => batch.delete(doc.ref));
          await batch.commit();
        }
        return docs.length;
      }

      let deleteCount = 0;
      for (const name of [COLLECTION_NAMES.LEDGER_EVENTS, COLLECTION_NAMES.ALERTS, COLLECTION_NAMES.CONSENT_STATE, COLLECTION_NAMES.SNAPSHOTS]) {
        deleteCount += await deleteInBatches(db.collection(name).where('userId', '==', userId));
      }
      if (deleteOrgs) {
        for (const orgId of DEMO_ORG_IDS) {
          deleteCount += await deleteInBatches(db.collection(COLLECTION_NAMES.ORGS).where('orgId', '==', orgId));
        }
      }

      return json({
        success: true,
        deleted: deleteCount,
        message: `Deleted ${deleteCount} documents for user ${userId}`,
      });
    } catch (error) {
      console.error('Error resetting sandbox:', error?.code || error?.name || 'error');
      return json({ error: 'Failed to reset sandbox' }, { status: 500 });
    }
  };
}
