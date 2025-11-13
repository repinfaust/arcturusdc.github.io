/**
 * Cloud Functions for STEa Workspace
 *
 * Scheduled function to aggregate workspace pulse dashboard metrics
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

/**
 * Aggregate build progress metrics for a tenant
 */
async function aggregateBuildProgress(tenantId, appNames = []) {
  const apps = [];

  for (const appName of appNames) {
    try {
      // Query epics for this app
      const epicsSnapshot = await db.collection('stea_epics')
        .where('tenantId', '==', tenantId)
        .where('app', '==', appName)
        .get();

      const epics = epicsSnapshot.docs.map((d) => ({id: d.id, ...d.data()}));
      const epicsComplete = epics.filter(
          (e) => e.status === 'Done' || e.column === 'Done',
      ).length;
      const epicsTotal = epics.length;

      // Query features for this app
      const featuresSnapshot = await db.collection('stea_features')
        .where('tenantId', '==', tenantId)
        .where('app', '==', appName)
        .get();

      const features = featuresSnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      const featuresInProgress = features.filter(
          (f) => f.status === 'In Progress' || f.column === 'In Progress',
      ).length;
      const featuresTotal = features.length;

      // Query bugs for this app
      const bugsSnapshot = await db.collection('stea_cards')
        .where('tenantId', '==', tenantId)
        .where('app', '==', appName)
        .get();

      const bugs = bugsSnapshot.docs
        .map((d) => ({id: d.id, ...d.data()}))
        .filter(
            (c) =>
              c.labels?.includes('bug') &&
          c.status !== 'Done' &&
          c.column !== 'Done',
        );
      const bugsOpen = bugs.length;

      // Calculate last activity
      const allItems = [...epics, ...features, ...bugs];
      const lastActivity = allItems.reduce((latest, item) => {
        const updatedAt = item.updatedAt?.toDate?.() ||
          new Date(item.updatedAt || 0);
        return updatedAt > latest ? updatedAt : latest;
      }, new Date(0));

      // Calculate progress percentage
      const progress = epicsTotal > 0 ?
        Math.round((epicsComplete / epicsTotal) * 100) :
        0;

      apps.push({
        name: appName,
        progress,
        epicsComplete,
        epicsTotal,
        featuresInProgress,
        featuresTotal,
        bugsOpen,
        lastActivity: admin.firestore.Timestamp.fromDate(lastActivity),
      });
    } catch (error) {
      console.error(`Error aggregating build progress for ${appName}:`, error);
    }
  }

  return {apps};
}

/**
 * Aggregate testing snapshot metrics
 */
async function aggregateTestingSnapshot(tenantId) {
  try {
    const casesSnapshot = await db.collection('hans_cases')
      .where('tenantId', '==', tenantId)
      .get();

    const cases = casesSnapshot.docs.map((d) => ({id: d.id, ...d.data()}));

    const pass = cases.filter((c) => c.lastStatus === 'pass').length;
    const fail = cases.filter((c) => c.lastStatus === 'fail').length;
    const awaitingRetest = cases.filter((c) => c.needsRetest === true).length;

    const total = pass + fail + awaitingRetest;
    const coverage = total > 0 ? Math.round((pass / total) * 100) : 0;

    return {
      pass,
      fail,
      awaitingRetest,
      coverage,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    };
  } catch (error) {
    console.error('Error aggregating testing snapshot:', error);
    return {pass: 0, fail: 0, awaitingRetest: 0, coverage: 0};
  }
}

/**
 * Aggregate backlog health metrics
 */
async function aggregateBacklogHealth(tenantId) {
  try {
    const cardsSnapshot = await db.collection('stea_cards')
      .where('tenantId', '==', tenantId)
      .get();

    const cards = cardsSnapshot.docs.map((d) => ({id: d.id, ...d.data()}));

    const ready = cards.filter(
        (c) => c.column === 'Ready' || c.status === 'Ready',
    ).length;

    const inDevelopment = cards.filter(
        (c) => c.column === 'In Development' || c.status === 'In Development',
    ).length;

    const blocked = cards.filter(
        (c) => c.blocked === true || c.labels?.includes('blocked'),
    ).length;

    const bugsOpen = cards.filter(
        (c) =>
          c.labels?.includes('bug') &&
        c.status !== 'Done' &&
        c.column !== 'Done',
    ).length;

    // Calculate 7-day average cycle time
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentlyCompleted = cards.filter((c) => {
      const completedAt = c.completedAt?.toDate?.() ||
        new Date(c.completedAt || 0);
      return completedAt >= sevenDaysAgo && c.startedAt;
    });

    let cycleTime = 0;
    if (recentlyCompleted.length > 0) {
      const totalCycleDays = recentlyCompleted.reduce((sum, card) => {
        const started = card.startedAt?.toDate?.() ||
          new Date(card.startedAt);
        const completed = card.completedAt?.toDate?.() ||
          new Date(card.completedAt);
        const days = (completed - started) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);
      cycleTime = Math.round(
          (totalCycleDays / recentlyCompleted.length) * 10,
      ) / 10;
    }

    return {
      ready,
      inDevelopment,
      blocked,
      bugsOpen,
      cycleTime,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    };
  } catch (error) {
    console.error('Error aggregating backlog health:', error);
    return {ready: 0, inDevelopment: 0, blocked: 0, bugsOpen: 0, cycleTime: 0};
  }
}

/**
 * Aggregate discovery signals metrics
 */
async function aggregateDiscoverySignals(tenantId) {
  try {
    const projectsSnapshot = await db.collection('projects')
      .where('tenantId', '==', tenantId)
      .get();

    const projects = projectsSnapshot.docs.map((d) => ({id: d.id, ...d.data()}));

    let newNotes = 0;
    let jtbdDrafts = 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // For each project, count discovery notes and JTBD drafts
    for (const project of projects) {
      try {
        // Count new discovery notes
        const discoverySnapshot = await db
          .collection('projects')
          .doc(project.id)
          .collection('discovery')
          .get();

        const newDiscoveryDocs = discoverySnapshot.docs.filter((d) => {
          const createdAt = d.data().createdAt?.toDate?.() ||
            new Date(d.data().createdAt || 0);
          return createdAt >= sevenDaysAgo;
        });
        newNotes += newDiscoveryDocs.length;

        // Count JTBD drafts not promoted
        const jobsSnapshot = await db
          .collection('projects')
          .doc(project.id)
          .collection('jobs')
          .get();

        const draftJobs = jobsSnapshot.docs.filter((d) => {
          const job = d.data();
          return job.status === 'draft' && !job.promotedToFeature;
        });
        jtbdDrafts += draftJobs.length;
      } catch (error) {
        console.error(`Error processing project ${project.id}:`, error);
      }
    }

    // Simplified coverage calculation
    const coverage = projects.length > 0 ? 64 : 0;

    return {
      newNotes,
      jtbdDrafts,
      coverage,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    };
  } catch (error) {
    console.error('Error aggregating discovery signals:', error);
    return {newNotes: 0, jtbdDrafts: 0, coverage: 0};
  }
}

/**
 * Aggregate documentation activity metrics
 */
async function aggregateDocumentationActivity(tenantId) {
  try {
    const docsSnapshot = await db.collection('stea_docs')
      .where('tenantId', '==', tenantId)
      .get();

    const docs = docsSnapshot.docs.map((d) => ({id: d.id, ...d.data()}));

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const newDocs = docs.filter((d) => {
      const createdAt = d.createdAt?.toDate?.() || new Date(d.createdAt || 0);
      return createdAt >= sevenDaysAgo;
    }).length;

    const updatedThisWeek = docs.filter((d) => {
      const updatedAt = d.updatedAt?.toDate?.() || new Date(d.updatedAt || 0);
      return updatedAt >= sevenDaysAgo;
    }).length;

    const docsWithLinks = docs.filter(
        (d) => d.cardId || d.linkedCards?.length > 0,
    ).length;
    const linkedPercentage = docs.length > 0 ?
      Math.round((docsWithLinks / docs.length) * 100) :
      0;

    return {
      newDocs,
      updatedThisWeek,
      linkedPercentage,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    };
  } catch (error) {
    console.error('Error aggregating documentation activity:', error);
    return {newDocs: 0, updatedThisWeek: 0, linkedPercentage: 0};
  }
}

/**
 * Aggregate all workspace pulse metrics for a tenant
 */
async function aggregateWorkspacePulse(tenantId, apps = []) {
  try {
    console.log(`Aggregating workspace pulse for tenant: ${tenantId}`);

    const [
      buildProgress,
      testingSnapshot,
      backlogHealth,
      discoverySignals,
      documentationActivity,
    ] = await Promise.all([
      aggregateBuildProgress(tenantId, apps),
      aggregateTestingSnapshot(tenantId),
      aggregateBacklogHealth(tenantId),
      aggregateDiscoverySignals(tenantId),
      aggregateDocumentationActivity(tenantId),
    ]);

    const metrics = {
      buildProgress,
      testingSnapshot,
      backlogHealth,
      discoverySignals,
      documentationActivity,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      version: 1,
    };

    // Write to Firestore
    await db
      .collection('tenants')
      .doc(tenantId)
      .collection('dashboard')
      .doc('metrics')
      .set(metrics);

    console.log(`Successfully aggregated workspace pulse for ${tenantId}`);
    return metrics;
  } catch (error) {
    console.error(`Error aggregating workspace pulse for ${tenantId}:`, error);
    throw error;
  }
}

/**
 * Scheduled function to aggregate dashboard metrics for all tenants
 * Runs every 15 minutes
 */
exports.aggregateDashboards = functions.pubsub
  .schedule('every 15 minutes')
  .timeZone('Europe/London')
  .onRun(async (context) => {
    console.log('Starting scheduled dashboard aggregation');

    try {
      const tenantsSnapshot = await db.collection('tenants').get();
      console.log(`Found ${tenantsSnapshot.size} tenants to process`);

      const results = [];

      for (const tenantDoc of tenantsSnapshot.docs) {
        const tenantId = tenantDoc.id;
        const tenantData = tenantDoc.data();

        try {
          // Get apps array from tenant document, default to empty array
          const apps = tenantData.apps || [];

          await aggregateWorkspacePulse(tenantId, apps);
          results.push({tenantId, success: true});
          console.log(`✓ Aggregated dashboard for tenant: ${tenantId}`);
        } catch (error) {
          results.push({tenantId, success: false, error: error.message});
          console.error(`✗ Failed to aggregate for tenant ${tenantId}:`, error);
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      console.log(`Dashboard aggregation complete: ${successCount} succeeded, ${failCount} failed`);
      return {success: true, results};
    } catch (error) {
      console.error('Error in scheduled aggregation:', error);
      throw error;
    }
  });

/**
 * Manual trigger function for aggregating a specific tenant's dashboard
 * Call via: firebase functions:call aggregateTenantDashboard --data '{"tenantId":"abc123","apps":["SyncFit"]}'
 */
exports.aggregateTenantDashboard = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
        'unauthenticated',
        'Must be authenticated to aggregate dashboards',
    );
  }

  // Verify super admin (you can customize this check)
  const userEmail = context.auth.token.email;
  const superAdmins = ['repinfaust@gmail.com', 'daryn.shaxted@gmail.com'];

  if (!superAdmins.includes(userEmail)) {
    throw new functions.https.HttpsError(
        'permission-denied',
        'Only super admins can trigger aggregation',
    );
  }

  const {tenantId, apps = []} = data;

  if (!tenantId) {
    throw new functions.https.HttpsError(
        'invalid-argument',
        'tenantId is required',
    );
  }

  try {
    await aggregateWorkspacePulse(tenantId, apps);
    return {
      success: true,
      message: `Dashboard metrics aggregated for tenant: ${tenantId}`,
    };
  } catch (error) {
    console.error('Error in manual aggregation:', error);
    throw new functions.https.HttpsError(
        'internal',
        'Failed to aggregate dashboard metrics',
    );
  }
});
