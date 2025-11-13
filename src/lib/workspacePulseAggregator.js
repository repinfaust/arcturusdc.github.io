/**
 * Workspace Pulse Dashboard Aggregator
 *
 * This module provides functions to aggregate metrics across STEa modules
 * for the Workspace Pulse dashboard.
 *
 * Can be called:
 * - Manually by super admins
 * - Via Cloud Function on a schedule
 * - Via API endpoint with proper auth
 */

import { db } from './firebase';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  setDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

/**
 * Aggregate build progress metrics for a tenant
 * @param {string} tenantId - The tenant ID
 * @param {string[]} appNames - Array of app names to track (e.g., ['SyncFit', 'Toume'])
 * @returns {Promise<Object>} Build progress data
 */
async function aggregateBuildProgress(tenantId, appNames = []) {
  const apps = [];

  for (const appName of appNames) {
    try {
      // Query epics for this app
      const epicsQuery = query(
        collection(db, 'stea_epics'),
        where('tenantId', '==', tenantId),
        where('app', '==', appName)
      );
      const epicsSnapshot = await getDocs(epicsQuery);
      const epics = epicsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      const epicsComplete = epics.filter(e => e.status === 'Done' || e.column === 'Done').length;
      const epicsTotal = epics.length;

      // Query features for this app
      const featuresQuery = query(
        collection(db, 'stea_features'),
        where('tenantId', '==', tenantId),
        where('app', '==', appName)
      );
      const featuresSnapshot = await getDocs(featuresQuery);
      const features = featuresSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      const featuresInProgress = features.filter(
        f => f.status === 'In Progress' || f.column === 'In Progress'
      ).length;
      const featuresTotal = features.length;

      // Query bugs for this app
      const bugsQuery = query(
        collection(db, 'stea_cards'),
        where('tenantId', '==', tenantId),
        where('app', '==', appName)
      );
      const bugsSnapshot = await getDocs(bugsQuery);
      const bugs = bugsSnapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(c =>
          c.labels?.includes('bug') &&
          c.status !== 'Done' &&
          c.column !== 'Done'
        );
      const bugsOpen = bugs.length;

      // Calculate last activity
      const allItems = [...epics, ...features, ...bugs];
      const lastActivity = allItems.reduce((latest, item) => {
        const updatedAt = item.updatedAt?.toDate?.() || new Date(item.updatedAt || 0);
        return updatedAt > latest ? updatedAt : latest;
      }, new Date(0));

      // Calculate progress percentage
      const progress = epicsTotal > 0
        ? Math.round((epicsComplete / epicsTotal) * 100)
        : 0;

      apps.push({
        name: appName,
        progress,
        epicsComplete,
        epicsTotal,
        featuresInProgress,
        featuresTotal,
        bugsOpen,
        lastActivity: Timestamp.fromDate(lastActivity),
      });
    } catch (error) {
      console.error(`Error aggregating build progress for app ${appName}:`, error);
      // Continue with other apps even if one fails
    }
  }

  return { apps };
}

/**
 * Aggregate testing snapshot metrics for a tenant
 * @param {string} tenantId - The tenant ID
 * @returns {Promise<Object>} Testing snapshot data
 */
async function aggregateTestingSnapshot(tenantId) {
  try {
    // Query Hans test cases
    const casesQuery = query(
      collection(db, 'hans_cases'),
      where('tenantId', '==', tenantId)
    );
    const casesSnapshot = await getDocs(casesQuery);
    const cases = casesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    const pass = cases.filter(c => c.lastStatus === 'pass').length;
    const fail = cases.filter(c => c.lastStatus === 'fail').length;
    const awaitingRetest = cases.filter(c => c.needsRetest === true).length;

    const total = pass + fail + awaitingRetest;
    const coverage = total > 0 ? Math.round((pass / total) * 100) : 0;

    return {
      pass,
      fail,
      awaitingRetest,
      coverage,
      lastUpdated: serverTimestamp(),
    };
  } catch (error) {
    console.error('Error aggregating testing snapshot:', error);
    return {
      pass: 0,
      fail: 0,
      awaitingRetest: 0,
      coverage: 0,
    };
  }
}

/**
 * Aggregate backlog health metrics for a tenant
 * @param {string} tenantId - The tenant ID
 * @returns {Promise<Object>} Backlog health data
 */
async function aggregateBacklogHealth(tenantId) {
  try {
    const cardsQuery = query(
      collection(db, 'stea_cards'),
      where('tenantId', '==', tenantId)
    );
    const cardsSnapshot = await getDocs(cardsQuery);
    const cards = cardsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    const ready = cards.filter(c =>
      c.column === 'Ready' || c.status === 'Ready'
    ).length;

    const inDevelopment = cards.filter(c =>
      c.column === 'In Development' || c.status === 'In Development'
    ).length;

    const blocked = cards.filter(c =>
      c.blocked === true || c.labels?.includes('blocked')
    ).length;

    const bugsOpen = cards.filter(c =>
      c.labels?.includes('bug') &&
      c.status !== 'Done' &&
      c.column !== 'Done'
    ).length;

    // Calculate 7-day average cycle time
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentlyCompleted = cards.filter(c => {
      const completedAt = c.completedAt?.toDate?.() || new Date(c.completedAt || 0);
      return completedAt >= sevenDaysAgo && c.startedAt;
    });

    let cycleTime = 0;
    if (recentlyCompleted.length > 0) {
      const totalCycleDays = recentlyCompleted.reduce((sum, card) => {
        const started = card.startedAt?.toDate?.() || new Date(card.startedAt);
        const completed = card.completedAt?.toDate?.() || new Date(card.completedAt);
        const days = (completed - started) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);
      cycleTime = Math.round((totalCycleDays / recentlyCompleted.length) * 10) / 10;
    }

    return {
      ready,
      inDevelopment,
      blocked,
      bugsOpen,
      cycleTime,
      lastUpdated: serverTimestamp(),
    };
  } catch (error) {
    console.error('Error aggregating backlog health:', error);
    return {
      ready: 0,
      inDevelopment: 0,
      blocked: 0,
      bugsOpen: 0,
      cycleTime: 0,
    };
  }
}

/**
 * Aggregate discovery signals metrics for a tenant
 * @param {string} tenantId - The tenant ID
 * @returns {Promise<Object>} Discovery signals data
 */
async function aggregateDiscoverySignals(tenantId) {
  try {
    // Query Harls projects
    const projectsQuery = query(
      collection(db, 'projects'),
      where('tenantId', '==', tenantId)
    );
    const projectsSnapshot = await getDocs(projectsQuery);
    const projects = projectsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    let newNotes = 0;
    let jtbdDrafts = 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // For each project, count discovery notes and JTBD drafts
    for (const project of projects) {
      try {
        // Count new discovery notes
        const discoveryRef = collection(db, 'projects', project.id, 'discovery');
        const discoverySnapshot = await getDocs(discoveryRef);
        const newDiscoveryDocs = discoverySnapshot.docs.filter(d => {
          const createdAt = d.data().createdAt?.toDate?.() || new Date(d.data().createdAt || 0);
          return createdAt >= sevenDaysAgo;
        });
        newNotes += newDiscoveryDocs.length;

        // Count JTBD drafts not promoted
        const jobsRef = collection(db, 'projects', project.id, 'jobs');
        const jobsSnapshot = await getDocs(jobsRef);
        const draftJobs = jobsSnapshot.docs.filter(d => {
          const job = d.data();
          return job.status === 'draft' && !job.promotedToFeature;
        });
        jtbdDrafts += draftJobs.length;
      } catch (error) {
        console.error(`Error processing project ${project.id}:`, error);
      }
    }

    // Calculate discovery coverage (simplified)
    // In a full implementation, this would check feature-to-discovery links
    const coverage = projects.length > 0 ? 64 : 0; // Placeholder

    return {
      newNotes,
      jtbdDrafts,
      coverage,
      lastUpdated: serverTimestamp(),
    };
  } catch (error) {
    console.error('Error aggregating discovery signals:', error);
    return {
      newNotes: 0,
      jtbdDrafts: 0,
      coverage: 0,
    };
  }
}

/**
 * Aggregate documentation activity metrics for a tenant
 * @param {string} tenantId - The tenant ID
 * @returns {Promise<Object>} Documentation activity data
 */
async function aggregateDocumentationActivity(tenantId) {
  try {
    const docsQuery = query(
      collection(db, 'stea_docs'),
      where('tenantId', '==', tenantId)
    );
    const docsSnapshot = await getDocs(docsQuery);
    const docs = docsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const newDocs = docs.filter(d => {
      const createdAt = d.createdAt?.toDate?.() || new Date(d.createdAt || 0);
      return createdAt >= sevenDaysAgo;
    }).length;

    const updatedThisWeek = docs.filter(d => {
      const updatedAt = d.updatedAt?.toDate?.() || new Date(d.updatedAt || 0);
      return updatedAt >= sevenDaysAgo;
    }).length;

    const docsWithLinks = docs.filter(d => d.cardId || d.linkedCards?.length > 0).length;
    const linkedPercentage = docs.length > 0
      ? Math.round((docsWithLinks / docs.length) * 100)
      : 0;

    return {
      newDocs,
      updatedThisWeek,
      linkedPercentage,
      lastUpdated: serverTimestamp(),
    };
  } catch (error) {
    console.error('Error aggregating documentation activity:', error);
    return {
      newDocs: 0,
      updatedThisWeek: 0,
      linkedPercentage: 0,
    };
  }
}

/**
 * Aggregate all workspace pulse metrics for a tenant
 * @param {string} tenantId - The tenant ID
 * @param {Object} options - Configuration options
 * @param {string[]} options.apps - Array of app names to track
 * @returns {Promise<Object>} Complete dashboard metrics
 */
export async function aggregateWorkspacePulse(tenantId, options = {}) {
  const { apps = [] } = options;

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
      lastUpdated: serverTimestamp(),
      version: 1,
    };

    // Write to Firestore
    const dashboardRef = doc(db, 'tenants', tenantId, 'dashboard', 'metrics');
    await setDoc(dashboardRef, metrics);

    console.log(`Successfully aggregated workspace pulse for tenant: ${tenantId}`);
    return metrics;
  } catch (error) {
    console.error(`Error aggregating workspace pulse for tenant ${tenantId}:`, error);
    throw error;
  }
}

/**
 * Get current dashboard metrics for a tenant (without recalculating)
 * @param {string} tenantId - The tenant ID
 * @returns {Promise<Object|null>} Current dashboard metrics or null if not found
 */
export async function getWorkspacePulseMetrics(tenantId) {
  try {
    const dashboardRef = doc(db, 'tenants', tenantId, 'dashboard', 'metrics');
    const dashboardSnap = await getDoc(dashboardRef);

    if (dashboardSnap.exists()) {
      return dashboardSnap.data();
    }
    return null;
  } catch (error) {
    console.error(`Error fetching workspace pulse for tenant ${tenantId}:`, error);
    return null;
  }
}
