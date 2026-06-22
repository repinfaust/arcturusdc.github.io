/**
 * Cloud Functions for STEa Workspace
 *
 * - Scheduled dashboard aggregation
 * - Email notifications: assignments + Dialled MTB user feedback
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const wc26 = require('./wc26/service');

admin.initializeApp();
const db = admin.firestore();

// ─── WC26 Value Engine: deterministic Firestore sync/refit ─────────────────

exports.seedWc26Data = functions.https.onCall(wc26.seedWc26Data);

exports.refitWc26RatingsNow = functions.https.onCall(wc26.refitWc26RatingsNow);

exports.refitWc26Ratings = functions.pubsub
  .schedule('every 24 hours')
  .timeZone('Europe/London')
  .onRun(wc26.refitWc26RatingsScheduled);

exports.syncWc26PredictionsNow = functions.https.onCall(
  wc26.syncWc26PredictionsNow,
);

exports.syncWc26Predictions = functions.pubsub
  .schedule('every 6 hours')
  .timeZone('Europe/London')
  .onRun(wc26.syncWc26PredictionsScheduled);

exports.gradeWc26PredictionsNow = functions.https.onCall(
  wc26.gradeWc26PredictionsNow,
);

exports.onWc26ResultFinalized = functions.firestore
  .document('wc26_results/{id}')
  .onWrite(wc26.onWc26ResultFinalized);

// Closing-line snapshot driver. Vercel Hobby allows only daily crons, so the
// schedule lives here (no plan limit) and calls the Vercel route, which is
// 0-cost unless a game is within its kickoff window. Hourly is safe: the route
// gates on kickoff time before spending an Odds API call. Needs WC26_SITE_URL
// and WC26_CRON_SECRET in functions env (secret matches Vercel's CRON_SECRET).
exports.snapshotWc26ClosingOdds = functions.pubsub
  .schedule('every 1 hours')
  .timeZone('Europe/London')
  .onRun(async () => {
    const base = process.env.WC26_SITE_URL || 'https://www.arcturusdc.com';
    const secret = process.env.WC26_CRON_SECRET;
    if (!secret) {
      console.warn('[wc26] snapshot skipped: WC26_CRON_SECRET not set');
      return null;
    }
    try {
      const res = await fetch(`${base}/api/stea/wc26/snapshot-closing`, {
        method: 'POST',
        headers: {Authorization: `Bearer ${secret}`},
      });
      const body = await res.json().catch(() => ({}));
      console.log('[wc26] snapshot-closing:', res.status, JSON.stringify(body));
    } catch (err) {
      console.error('[wc26] snapshot-closing call failed:', err.message);
    }
    return null;
  });

// ─── Helpers ─────────────────────────────────────────────────────────────────

const LOGO_URL = 'https://arcturusdc.com/img/stea-logo.png';

function isEmail(val) {
  return typeof val === 'string' && val.includes('@') && val.includes('.');
}

function emailHtml(body) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:540px;width:100%;">
        <tr><td style="background:#1a1a1a;padding:24px;text-align:center;">
          <img src="${LOGO_URL}" width="40" height="40" alt="STEa" style="display:inline-block;border-radius:6px;">
          <span style="display:inline-block;vertical-align:middle;margin-left:12px;color:#ffffff;font-size:18px;font-weight:600;letter-spacing:0.02em;">STEa</span>
        </td></tr>
        <tr><td style="padding:32px;color:#333333;font-size:15px;line-height:1.6;">
          ${body}
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #eeeeee;text-align:center;color:#999999;font-size:12px;">
          Sent by STEa · <a href="https://arcturusdc.com/apps/stea" style="color:#e03a2f;text-decoration:none;">Open STEa</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendMail(to, subject, body) {
  await db.collection('mail').add({ to, message: { subject, html: emailHtml(body) } });
}

// ─── Assignment: Epics ────────────────────────────────────────────────────────

exports.onEpicAssigned = functions.firestore
  .document('stea_epics/{id}')
  .onWrite(async (change) => {
    const before = change.before.data() || {};
    const after = change.after.data();
    if (!after) return;
    const prev = before.assignee || '';
    const next = after.assignee || '';
    if (!next || next === prev || !isEmail(next)) return;
    await sendMail(
      next,
      `[STEa] Epic assigned to you: ${after.title || 'Untitled'}`,
      `<p>You've been assigned to an epic on STEa.</p>
       <p><strong>Epic:</strong> ${after.title || 'Untitled'}<br>
       ${after.app ? `<strong>App:</strong> ${after.app}` : ''}</p>`,
    );
  });

// ─── Assignment: Features ─────────────────────────────────────────────────────

exports.onFeatureAssigned = functions.firestore
  .document('stea_features/{id}')
  .onWrite(async (change) => {
    const before = change.before.data() || {};
    const after = change.after.data();
    if (!after) return;
    const prev = before.assignee || '';
    const next = after.assignee || '';
    if (!next || next === prev || !isEmail(next)) return;
    await sendMail(
      next,
      `[STEa] Feature assigned to you: ${after.title || 'Untitled'}`,
      `<p>You've been assigned to a feature on STEa.</p>
       <p><strong>Feature:</strong> ${after.title || 'Untitled'}<br>
       ${after.app ? `<strong>App:</strong> ${after.app}` : ''}</p>`,
    );
  });

// ─── Assignment: Cards ────────────────────────────────────────────────────────

exports.onCardAssigned = functions.firestore
  .document('stea_cards/{id}')
  .onWrite(async (change) => {
    const before = change.before.data() || {};
    const after = change.after.data();
    if (!after) return;
    const prev = before.assignee || '';
    const next = after.assignee || '';
    if (!next || next === prev || !isEmail(next)) return;
    await sendMail(
      next,
      `[STEa] Card assigned to you: ${after.title || 'Untitled'}`,
      `<p>You've been assigned to a card on STEa.</p>
       <p><strong>Card:</strong> ${after.title || 'Untitled'}<br>
       ${after.app ? `<strong>App:</strong> ${after.app}` : ''}</p>`,
    );
  });

// ─── Assignment: Test Cases (hans_cases) ─────────────────────────────────────

exports.onTestCaseAssigned = functions.firestore
  .document('hans_cases/{id}')
  .onWrite(async (change) => {
    const before = change.before.data() || {};
    const after = change.after.data();
    if (!after) return;
    const prevUids = before.assignees || [];
    const nextUids = after.assignees || [];
    const newUids = nextUids.filter((uid) => !prevUids.includes(uid));
    if (!newUids.length) return;
    await Promise.all(newUids.map(async (uid) => {
      try {
        const user = await admin.auth().getUser(uid);
        if (!user.email) return;
        await sendMail(
          user.email,
          `[STEa] Test case assigned to you: ${after.title || 'Untitled'}`,
          `<p>You've been assigned to a test case on STEa.</p>
           <p><strong>Test case:</strong> ${after.title || 'Untitled'}</p>`,
        );
      } catch (e) {
        console.warn(`onTestCaseAssigned: could not look up uid ${uid}:`, e.message);
      }
    }));
  });

// ─── Feedback: Dialled MTB (scheduled poll every 5 min) ──────────────────────
// Cross-project: Cloud Functions SA on stea-775cd has roles/datastore.viewer on
// dialledmtb-ea850 — no service account key needed, ADC handles auth.

const FEEDBACK_RECIPIENTS = ['repinfaust@gmail.com', 'dialled.app@gmail.com'];
const FEEDBACK_CURSOR_PATH = 'system/dialledMtbFeedbackCursor';

let dialledDb = null;

function getDialledDb() {
  if (dialledDb) return dialledDb;
  const app = admin.apps.find((a) => a.name === 'dialledmtb') ||
    admin.initializeApp({ projectId: 'dialledmtb-ea850' }, 'dialledmtb');
  dialledDb = app.firestore();
  return dialledDb;
}

exports.pollDialledMtbFeedback = functions.pubsub
  .schedule('every 5 minutes')
  .timeZone('Europe/London')
  .onRun(async () => {
    const ddb = getDialledDb();

    const cursorSnap = await db.doc(FEEDBACK_CURSOR_PATH).get();
    const lastChecked = cursorSnap.exists
      ? cursorSnap.data().lastChecked.toDate()
      : new Date(Date.now() - 5 * 60 * 1000);

    const snap = await ddb.collection('feedback')
      .where('createdAt', '>', admin.firestore.Timestamp.fromDate(lastChecked))
      .orderBy('createdAt', 'asc')
      .limit(20)
      .get();

    if (!snap.empty) {
      await Promise.all(snap.docs.map(async (feedbackDoc) => {
        const f = feedbackDoc.data();
        const from = f.displayName || f.email || 'Anonymous';
        const typeLabel = f.type || 'feedback';
        const html = `
          <p>New <strong>${typeLabel}</strong> received from a Dialled MTB user.</p>
          <table style="border-collapse:collapse;width:100%;font-size:14px;">
            <tr><td style="padding:6px 0;color:#666;width:90px;">From</td><td style="padding:6px 0;">${from}${f.email ? ` &lt;${f.email}&gt;` : ''}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Message</td><td style="padding:6px 0;"><strong>${f.message || '—'}</strong></td></tr>
            <tr><td style="padding:6px 0;color:#666;">Screen</td><td style="padding:6px 0;">${f.screen || f.routeName || '—'}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Platform</td><td style="padding:6px 0;">${f.platform || '—'} · ${f.deviceModel || '—'}</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Version</td><td style="padding:6px 0;">${f.appVersion || '—'} (build ${f.buildNumber || '—'})</td></tr>
          </table>
        `;
        await sendMail(FEEDBACK_RECIPIENTS, `[Dialled MTB] New ${typeLabel} from ${from}`, html);
      }));
    }

    await db.doc(FEEDBACK_CURSOR_PATH).set({
      lastChecked: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`pollDialledMtbFeedback: processed ${snap.size} new feedback items`);
  });

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
 * Aggregate Career Ops metrics
 */
async function aggregateCareerOps(tenantId) {
  try {
    const rolesSnapshot = await db.collection('tenants')
      .doc(tenantId)
      .collection('career_ops_roles')
      .get();

    const cvsSnapshot = await db.collection('tenants')
      .doc(tenantId)
      .collection('career_ops_cvs')
      .get();

    const totalAnalysed = rolesSnapshot.size;
    const totalCvs = cvsSnapshot.size;

    return {
      totalAnalysed,
      totalCvs,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    };
  } catch (error) {
    console.error('Error aggregating career ops metrics:', error);
    return {totalAnalysed: 0, totalCvs: 0};
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
      careerOps,
    ] = await Promise.all([
      aggregateBuildProgress(tenantId, apps),
      aggregateTestingSnapshot(tenantId),
      aggregateBacklogHealth(tenantId),
      aggregateDiscoverySignals(tenantId),
      aggregateDocumentationActivity(tenantId),
      aggregateCareerOps(tenantId),
    ]);

    const metrics = {
      buildProgress,
      testingSnapshot,
      backlogHealth,
      discoverySignals,
      documentationActivity,
      careerOps,
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
