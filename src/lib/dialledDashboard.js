import { BetaAnalyticsDataClient } from '@google-analytics/data';

import { getDialledMtbAdmin } from '@/lib/dialledMtbAdmin';

const SNAPSHOT_COLLECTION = 'dashboardSnapshots';
const SNAPSHOT_SCHEMA_VERSION = 1;
const GA4_LAUNCH_DATE = '2026-05-01';
const DAY_MS = 24 * 60 * 60 * 1000;

const FUNNEL_STAGES = [
  { stage: 'registered', label: 'Registered' },
  { stage: 'bikeCreated', label: 'Bike Created' },
  { stage: 'setupComplete', label: 'Setup Complete' },
  { stage: 'stravaConnected', label: 'Strava Connected' },
  { stage: 'premium', label: 'Premium' },
  { stage: 'rideLogged', label: 'Ride Logged' },
  { stage: 'maintenance', label: 'Maintenance' },
];

export const METRIC_DEFINITIONS = `
- registeredUsers: count of user profile documents.
- premiumUsers: users whose RevenueCat-mirrored subscription.isPremium is true right now (churned users count as free).
- bikeProfiles: bikes not archived; bikeProfilesArchived counted separately.
- Funnel stages (distinct users, not sequential-gated): registered; bikeCreated = owns >=1 bike (incl. archived); setupComplete = >=1 bike with suspension/tyre setup data saved; stravaConnected = Strava OAuth connection exists; premium; rideLogged = >=1 ride document; maintenance = >=1 logged service event (a completed/recorded service, not an auto-generated schedule task).
- aiConversations: AI advisor/insight exchanges (aiInsights docs + advisor chat history docs).
- lastActiveAt (per user): most recent createdAt across their rides, AI exchanges, maintenance entries and bikes. Deliberate in-app actions only.
- active7d / active30d: lastActiveAt within 7 / 30 days of the snapshot generatedAt. neverActive: no qualifying action ever.
- events30d (per user): rides + AI exchanges + maintenance entries created in the last 30 days.
- daysToFirstBike: whole days between user signup and their earliest bike creation.
- ga4 section: aggregate Google Analytics data (sessions, active users, event counts). It cannot be split by free vs premium.
- trends.registrations: cumulative registered users over time, derived from each user's createdAt (accurate for the full lifetime).
- trends.premiumVsFree: daily registered/premium/free counts taken from stored daily dashboard snapshots. Premium start dates are not recorded anywhere, so this history only exists from the first stored snapshot onward and grows one point per day. Never extrapolate premium status backwards.
- trends.bikeAdoption: cumulative % of registered users with >=1 bike over time, derived from each user's own createdAt/firstBikeAt (accurate for the full lifetime, unlike premium history). currentPctByPlan gives today's % of free vs premium users with a bike, using current premium status only — do not imply this split is historical.
- distributions section: how bikes/rides/maintenanceEntries/aiConversations counts are spread across all riders (bucketed histograms + min/median/mean/p90/max), independent of free vs premium. Shows whether usage is concentrated in a few power users or spread evenly.
`.trim();

function toIso(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  if (typeof value === 'object' && typeof value._seconds === 'number') {
    return new Date(value._seconds * 1000).toISOString();
  }
  return null;
}

function maxIso(...values) {
  const valid = values.filter(Boolean).sort();
  return valid.length ? valid[valid.length - 1] : null;
}

function minIso(...values) {
  const valid = values.filter(Boolean).sort();
  return valid.length ? valid[0] : null;
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function bucketDistribution(values, buckets) {
  const counts = buckets.map(() => 0);
  for (const value of values) {
    const index = buckets.findIndex((bucket) => value >= bucket.min && value <= bucket.max);
    counts[index === -1 ? buckets.length - 1 : index] += 1;
  }
  return buckets.map((bucket, index) => ({ label: bucket.label, count: counts[index] }));
}

function distributionSummary(values) {
  if (!values.length) return { min: 0, max: 0, median: 0, mean: 0, p90: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((total, value) => total + value, 0);
  const p90Index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.9) - 1);
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median: median(sorted),
    mean: Math.round((sum / sorted.length) * 10) / 10,
    p90: sorted[p90Index],
  };
}

function pct(part, whole) {
  if (!whole) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

function isoWeekStart(isoDate) {
  const date = new Date(isoDate);
  const day = (date.getUTCDay() + 6) % 7; // Monday = 0
  const monday = new Date(date.getTime() - day * DAY_MS);
  return monday.toISOString().slice(0, 10);
}

function normalizeRideSource(source) {
  const value = String(source || '').toLowerCase();
  if (value.includes('strava')) return 'strava';
  if (value.includes('health')) return 'health';
  return 'manual';
}

function mapDocs(snapshot) {
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function fetchFirestoreSource(db) {
  const [
    users,
    bikes,
    rides,
    maintenanceEntries,
    maintenanceTasks,
    stravaConnections,
    aiInsights,
    feedback,
    userFeatureFlags,
    advisorHistorySnap,
    serviceEvents,
  ] = await Promise.all([
    db.collection('users').get(),
    db.collection('bikes').get(),
    db.collection('rides').get(),
    db.collection('maintenanceEntries').get(),
    db.collection('maintenanceTasks').get(),
    db.collection('stravaConnections').get(),
    db.collection('aiInsights').get(),
    db.collection('feedback').get(),
    db.collection('userFeatureFlags').get(),
    db.collectionGroup('advisorHistory').get(),
    // Completed services live at bikes/{bikeId}/serviceEvents; the top-level
    // maintenanceEntries collection is empty in production but kept in the union.
    db.collectionGroup('serviceEvents').get(),
  ]);

  return {
    users: mapDocs(users),
    bikes: mapDocs(bikes),
    rides: mapDocs(rides),
    maintenanceEntries: [...mapDocs(maintenanceEntries), ...mapDocs(serviceEvents)],
    maintenanceTasks: mapDocs(maintenanceTasks),
    stravaConnections: mapDocs(stravaConnections),
    aiInsights: mapDocs(aiInsights),
    feedback: mapDocs(feedback),
    userFeatureFlags: mapDocs(userFeatureFlags),
    advisorHistory: advisorHistorySnap.docs.map((doc) => ({
      id: doc.id,
      ownerUid: doc.ref.parent.parent?.id || null,
      ...doc.data(),
    })),
  };
}

function groupByOwner(items, ownerKey = 'ownerUid') {
  const map = new Map();
  for (const item of items) {
    const uid = item[ownerKey];
    if (!uid) continue;
    if (!map.has(uid)) map.set(uid, []);
    map.get(uid).push(item);
  }
  return map;
}

export function buildSnapshot(raw, { generatedAt = new Date().toISOString(), trigger = 'manual', actorEmail = null, ga4 = null, history = [] } = {}) {
  const now = new Date(generatedAt).getTime();
  const cutoff7d = new Date(now - 7 * DAY_MS).toISOString();
  const cutoff30d = new Date(now - 30 * DAY_MS).toISOString();

  const bikesByOwner = groupByOwner(raw.bikes);
  const ridesByOwner = groupByOwner(raw.rides);
  const maintenanceByOwner = groupByOwner(raw.maintenanceEntries);
  const tasksByOwner = groupByOwner(raw.maintenanceTasks);
  const aiByOwner = groupByOwner(raw.aiInsights);
  const advisorByOwner = groupByOwner(raw.advisorHistory);
  const feedbackByOwner = groupByOwner(
    raw.feedback.map((item) => ({ ...item, ownerUid: item.uid || item.ownerUid || null })),
  );
  const stravaUids = new Set(raw.stravaConnections.map((doc) => doc.id));
  const flagsByUid = new Map(raw.userFeatureFlags.map((doc) => [doc.id, doc]));

  const userRows = raw.users.map((userDoc) => {
    const uid = userDoc.id;
    const createdAt = toIso(userDoc.createdAt);
    const isPremium = userDoc.subscription?.isPremium === true;

    const bikes = bikesByOwner.get(uid) || [];
    const rides = ridesByOwner.get(uid) || [];
    const maintenance = maintenanceByOwner.get(uid) || [];
    const tasks = tasksByOwner.get(uid) || [];
    const ai = [...(aiByOwner.get(uid) || []), ...(advisorByOwner.get(uid) || [])];
    const feedbackItems = feedbackByOwner.get(uid) || [];

    const ridesBySource = { manual: 0, strava: 0, health: 0 };
    for (const ride of rides) ridesBySource[normalizeRideSource(ride.source)] += 1;

    const bikeCreatedTimes = bikes.map((bike) => toIso(bike.createdAt)).filter(Boolean);
    const firstBikeAt = minIso(...bikeCreatedTimes);
    const lastRideAt = maxIso(...rides.map((ride) => toIso(ride.createdAt)));
    const lastAiAt = maxIso(...ai.map((item) => toIso(item.createdAt)));
    const lastMaintenanceAt = maxIso(...maintenance.map((item) => toIso(item.createdAt)));
    const lastActiveAt = maxIso(lastRideAt, lastAiAt, lastMaintenanceAt, maxIso(...bikeCreatedTimes));

    let daysToFirstBike = null;
    if (createdAt && firstBikeAt) {
      daysToFirstBike = Math.max(0, Math.floor((new Date(firstBikeAt) - new Date(createdAt)) / DAY_MS));
    }

    const events30d = [...rides, ...ai, ...maintenance]
      .map((item) => toIso(item.createdAt))
      .filter((time) => time && time >= cutoff30d).length;

    const flagsDoc = flagsByUid.get(uid) || {};
    const labsFlags = Object.entries(flagsDoc)
      .filter(([key, value]) => key !== 'id' && value === true)
      .map(([key]) => key);

    return {
      uid,
      createdAt,
      isPremium,
      bikes: bikes.length,
      bikesArchived: bikes.filter((bike) => bike.isArchived === true).length,
      bikesWithSetup: bikes.filter((bike) => bike.setupData != null).length,
      rides: rides.length,
      ridesBySource,
      lastRideAt,
      maintenanceEntries: maintenance.length,
      maintenanceDue: tasks.filter((task) => task.isDue === true).length,
      stravaConnected: stravaUids.has(uid) || userDoc.stravaConnected === true,
      aiConversations: ai.length,
      lastAiAt,
      feedback: feedbackItems.length,
      labsFlags,
      firstBikeAt,
      daysToFirstBike,
      lastActiveAt,
      events30d,
    };
  });

  const premiumRows = userRows.filter((row) => row.isPremium);
  const freeRows = userRows.filter((row) => !row.isPremium);

  const totals = {
    registeredUsers: userRows.length,
    premiumUsers: premiumRows.length,
    freeUsers: freeRows.length,
    bikeProfiles: raw.bikes.filter((bike) => bike.isArchived !== true).length,
    bikeProfilesArchived: raw.bikes.filter((bike) => bike.isArchived === true).length,
    totalRides: raw.rides.length,
    ridesBySource: raw.rides.reduce(
      (acc, ride) => {
        acc[normalizeRideSource(ride.source)] += 1;
        return acc;
      },
      { manual: 0, strava: 0, health: 0 },
    ),
    stravaConnectedUsers: userRows.filter((row) => row.stravaConnected).length,
    usersWithMaintenanceActivity: userRows.filter((row) => row.maintenanceEntries > 0).length,
    usersWithMaintenanceDue: userRows.filter((row) => row.maintenanceDue > 0).length,
    aiConversations: raw.aiInsights.length + raw.advisorHistory.length,
    usersWithAi: userRows.filter((row) => row.aiConversations > 0).length,
    feedbackCount: raw.feedback.length,
  };

  const stageTest = {
    registered: () => true,
    bikeCreated: (row) => row.bikes > 0,
    setupComplete: (row) => row.bikesWithSetup > 0,
    stravaConnected: (row) => row.stravaConnected,
    premium: (row) => row.isPremium,
    rideLogged: (row) => row.rides > 0,
    maintenance: (row) => row.maintenanceEntries > 0,
  };

  const funnel = FUNNEL_STAGES.map(({ stage, label }) => ({
    stage,
    label,
    count: userRows.filter(stageTest[stage]).length,
  }));

  const featureTests = [
    { feature: 'bikeCreated', label: 'Bike created', test: (row) => row.bikes > 0, events: (row) => row.bikes },
    { feature: 'setupCompleted', label: 'Setup completed', test: (row) => row.bikesWithSetup > 0, events: (row) => row.bikesWithSetup },
    { feature: 'rideLoggedManual', label: 'Rides — manual', test: (row) => row.ridesBySource.manual > 0, events: (row) => row.ridesBySource.manual },
    { feature: 'rideLoggedStrava', label: 'Rides — Strava', test: (row) => row.ridesBySource.strava > 0, events: (row) => row.ridesBySource.strava },
    { feature: 'rideLoggedHealth', label: 'Rides — Health', test: (row) => row.ridesBySource.health > 0, events: (row) => row.ridesBySource.health },
    { feature: 'stravaConnected', label: 'Strava connected', test: (row) => row.stravaConnected, events: (row) => (row.stravaConnected ? 1 : 0) },
    { feature: 'maintenanceLogged', label: 'Maintenance logged', test: (row) => row.maintenanceEntries > 0, events: (row) => row.maintenanceEntries },
    { feature: 'aiAdvisorUsed', label: 'AI advisor used', test: (row) => row.aiConversations > 0, events: (row) => row.aiConversations },
    { feature: 'feedbackSent', label: 'Feedback sent', test: (row) => row.feedback > 0, events: (row) => row.feedback },
    { feature: 'labsFlagEnabled', label: 'Labs feature enabled', test: (row) => row.labsFlags.length > 0, events: (row) => row.labsFlags.length },
  ];

  function segmentStats(rows, { test, events }) {
    const using = rows.filter(test);
    return {
      users: using.length,
      events: rows.reduce((sum, row) => sum + events(row), 0),
      pctOfSegment: pct(using.length, rows.length),
    };
  }

  const featureMatrix = featureTests.map(({ feature, label, test, events }) => ({
    feature,
    label,
    free: segmentStats(freeRows, { test, events }),
    premium: segmentStats(premiumRows, { test, events }),
  }));

  function activityStats(rows) {
    const active30 = rows.filter((row) => row.lastActiveAt && row.lastActiveAt >= cutoff30d);
    const totalEvents30d = active30.reduce((sum, row) => sum + row.events30d, 0);
    return {
      active7d: rows.filter((row) => row.lastActiveAt && row.lastActiveAt >= cutoff7d).length,
      active30d: active30.length,
      neverActive: rows.filter((row) => !row.lastActiveAt).length,
      avgEventsPerActive30d: active30.length ? Math.round((totalEvents30d / active30.length) * 10) / 10 : 0,
    };
  }

  const timeToFirstBike = { sameDay: 0, d1to3: 0, d4to7: 0, d8plus: 0, never: 0 };
  const daysToBikeValues = [];
  for (const row of userRows) {
    if (row.daysToFirstBike == null) {
      timeToFirstBike.never += 1;
      continue;
    }
    daysToBikeValues.push(row.daysToFirstBike);
    if (row.daysToFirstBike === 0) timeToFirstBike.sameDay += 1;
    else if (row.daysToFirstBike <= 3) timeToFirstBike.d1to3 += 1;
    else if (row.daysToFirstBike <= 7) timeToFirstBike.d4to7 += 1;
    else timeToFirstBike.d8plus += 1;
  }

  const cohortMap = new Map();
  for (const row of userRows) {
    if (!row.createdAt) continue;
    const weekStart = isoWeekStart(row.createdAt);
    if (!cohortMap.has(weekStart)) {
      cohortMap.set(weekStart, {
        weekStart,
        registered: 0,
        bikeCreated: 0,
        setupComplete: 0,
        stravaConnected: 0,
        premium: 0,
        rideLogged: 0,
      });
    }
    const cohort = cohortMap.get(weekStart);
    cohort.registered += 1;
    if (row.bikes > 0) cohort.bikeCreated += 1;
    if (row.bikesWithSetup > 0) cohort.setupComplete += 1;
    if (row.stravaConnected) cohort.stravaConnected += 1;
    if (row.isPremium) cohort.premium += 1;
    if (row.rides > 0) cohort.rideLogged += 1;
  }
  const weeklyCohorts = [...cohortMap.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart));

  const recentRegistrantsWithoutBike = userRows
    .filter((row) => row.bikes === 0 && row.createdAt && row.createdAt >= cutoff30d)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((row) => ({
      uid: row.uid,
      createdAt: row.createdAt,
      daysSinceSignup: Math.floor((now - new Date(row.createdAt).getTime()) / DAY_MS),
      stravaConnected: row.stravaConnected,
      aiUsed: row.aiConversations > 0,
    }));

  const BIKE_BUCKETS = [
    { label: '0', min: 0, max: 0 },
    { label: '1', min: 1, max: 1 },
    { label: '2', min: 2, max: 2 },
    { label: '3+', min: 3, max: Infinity },
  ];
  const RIDE_BUCKETS = [
    { label: '0', min: 0, max: 0 },
    { label: '1-2', min: 1, max: 2 },
    { label: '3-5', min: 3, max: 5 },
    { label: '6-15', min: 6, max: 15 },
    { label: '16+', min: 16, max: Infinity },
  ];
  const MAINTENANCE_BUCKETS = [
    { label: '0', min: 0, max: 0 },
    { label: '1-2', min: 1, max: 2 },
    { label: '3-5', min: 3, max: 5 },
    { label: '6+', min: 6, max: Infinity },
  ];
  const AI_BUCKETS = [
    { label: '0', min: 0, max: 0 },
    { label: '1-2', min: 1, max: 2 },
    { label: '3-5', min: 3, max: 5 },
    { label: '6+', min: 6, max: Infinity },
  ];

  const distributions = {
    bikes: {
      buckets: bucketDistribution(userRows.map((row) => row.bikes), BIKE_BUCKETS),
      summary: distributionSummary(userRows.map((row) => row.bikes)),
    },
    rides: {
      buckets: bucketDistribution(userRows.map((row) => row.rides), RIDE_BUCKETS),
      summary: distributionSummary(userRows.map((row) => row.rides)),
    },
    maintenanceEntries: {
      buckets: bucketDistribution(userRows.map((row) => row.maintenanceEntries), MAINTENANCE_BUCKETS),
      summary: distributionSummary(userRows.map((row) => row.maintenanceEntries)),
    },
    aiConversations: {
      buckets: bucketDistribution(userRows.map((row) => row.aiConversations), AI_BUCKETS),
      summary: distributionSummary(userRows.map((row) => row.aiConversations)),
    },
  };

  const dayKey = generatedAt.slice(0, 10);
  const registrations = [];
  for (const date of userRows.map((row) => row.createdAt).filter(Boolean).map((iso) => iso.slice(0, 10)).sort()) {
    const last = registrations[registrations.length - 1];
    if (last && last.date === date) last.count += 1;
    else registrations.push({ date, count: (last?.count || 0) + 1 });
  }
  const lastRegistration = registrations[registrations.length - 1];
  if (lastRegistration && lastRegistration.date < dayKey) {
    registrations.push({ date: dayKey, count: lastRegistration.count });
  }

  // Bike adoption is derived from each user's own createdAt/firstBikeAt, so unlike
  // premium status this history is accurate for the full lifetime (no snapshot backfill needed).
  const bikeAdoptionEvents = userRows
    .map((row) => ({ registeredAt: row.createdAt, bikeAt: row.firstBikeAt }))
    .filter((row) => row.registeredAt)
    .sort((a, b) => a.registeredAt.localeCompare(b.registeredAt));
  const bikeAdoption = [];
  {
    let registeredSoFar = 0;
    let withBikeSoFar = 0;
    const dates = [...new Set(
      bikeAdoptionEvents.flatMap((row) => [row.registeredAt.slice(0, 10), row.bikeAt ? row.bikeAt.slice(0, 10) : null]).filter(Boolean),
    )].sort();
    for (const date of dates) {
      registeredSoFar += bikeAdoptionEvents.filter((row) => row.registeredAt.slice(0, 10) === date).length;
      withBikeSoFar += bikeAdoptionEvents.filter((row) => row.bikeAt && row.bikeAt.slice(0, 10) === date).length;
      bikeAdoption.push({
        date,
        registeredUsers: registeredSoFar,
        usersWithBike: withBikeSoFar,
        pctWithBike: pct(withBikeSoFar, registeredSoFar),
      });
    }
    const lastPoint = bikeAdoption[bikeAdoption.length - 1];
    if (lastPoint && lastPoint.date < dayKey) {
      bikeAdoption.push({ ...lastPoint, date: dayKey });
    }
  }

  // Premium/free history can only come from stored daily snapshots — Firestore
  // does not record when a user became premium, so no backfill is possible.
  const premiumVsFree = [
    ...history.filter((point) => point.date !== dayKey),
    {
      date: dayKey,
      registeredUsers: totals.registeredUsers,
      premiumUsers: totals.premiumUsers,
      freeUsers: totals.freeUsers,
    },
  ].sort((a, b) => a.date.localeCompare(b.date));

  return {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    generatedAt,
    trigger,
    actorEmail,
    totals,
    trends: {
      registrations,
      premiumVsFree,
      bikeAdoption: {
        points: bikeAdoption,
        currentPctByPlan: {
          free: pct(freeRows.filter((row) => row.bikes > 0).length, freeRows.length),
          premium: pct(premiumRows.filter((row) => row.bikes > 0).length, premiumRows.length),
        },
      },
    },
    ga4: ga4 || { error: 'GA4 metrics were not fetched.' },
    funnel,
    engagement: {
      featureMatrix,
      activity: { free: activityStats(freeRows), premium: activityStats(premiumRows) },
    },
    onboarding: {
      pctNeverCreatedBike: pct(timeToFirstBike.never, userRows.length),
      medianDaysToFirstBike: median(daysToBikeValues),
      timeToFirstBike,
      weeklyCohorts,
      recentRegistrantsWithoutBike,
    },
    distributions,
    users: userRows.sort((a, b) => String(b.lastActiveAt || '').localeCompare(String(a.lastActiveAt || ''))),
  };
}

function readGa4Credentials() {
  const raw =
    process.env.DIALLED_MTB_FIREBASE_SERVICE_ACCOUNT_KEY_JSON ||
    process.env.DIALLED_MTB_FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error('Dialled MTB service account is not configured.');
  const trimmed = raw.trim();
  const jsonString = trimmed.startsWith('{') ? trimmed : Buffer.from(trimmed, 'base64').toString('utf8');
  return JSON.parse(jsonString);
}

async function fetchGa4Metrics() {
  const propertyId = process.env.DIALLED_MTB_GA4_PROPERTY_ID;
  if (!propertyId) return { error: 'DIALLED_MTB_GA4_PROPERTY_ID is not set.' };

  try {
    const credentials = readGa4Credentials();
    const client = new BetaAnalyticsDataClient({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
    });
    const property = `properties/${propertyId}`;

    const [lifetime, last30, dailySessions, eventsLifetime, events30] = await Promise.all([
      client.runReport({
        property,
        dateRanges: [{ startDate: GA4_LAUNCH_DATE, endDate: 'today' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      }),
      client.runReport({
        property,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      }),
      client.runReport({
        property,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      }),
      client.runReport({
        property,
        dateRanges: [{ startDate: GA4_LAUNCH_DATE, endDate: 'today' }],
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        limit: 100,
      }),
      client.runReport({
        property,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        limit: 100,
      }),
    ]);

    const metricValue = (report, index = 0) =>
      Number(report[0]?.rows?.[0]?.metricValues?.[index]?.value || 0);

    const events30Map = new Map(
      (events30[0]?.rows || []).map((row) => [row.dimensionValues[0].value, Number(row.metricValues[0].value)]),
    );

    return {
      sessionsLifetime: metricValue(lifetime, 0),
      activeUsersLifetime: metricValue(lifetime, 1),
      sessions30d: metricValue(last30, 0),
      activeUsers30d: metricValue(last30, 1),
      dailySessions30d: (dailySessions[0]?.rows || []).map((row) => ({
        date: row.dimensionValues[0].value,
        sessions: Number(row.metricValues[0].value),
      })),
      eventCounts: (eventsLifetime[0]?.rows || [])
        .map((row) => ({
          eventName: row.dimensionValues[0].value,
          lifetime: Number(row.metricValues[0].value),
          last30d: events30Map.get(row.dimensionValues[0].value) || 0,
        }))
        .sort((a, b) => b.lifetime - a.lifetime),
    };
  } catch (error) {
    console.warn('[dialled-dashboard] GA4 fetch failed', error?.message);
    return { error: `GA4 unavailable: ${error?.message || 'unknown error'}` };
  }
}

async function fetchSnapshotHistory(db) {
  const snap = await db
    .collection(SNAPSHOT_COLLECTION)
    .select('totals.registeredUsers', 'totals.premiumUsers', 'totals.freeUsers')
    .get();
  return snap.docs
    .filter((doc) => /^\d{4}-\d{2}-\d{2}$/.test(doc.id))
    .map((doc) => {
      const totals = doc.data().totals || {};
      return {
        date: doc.id,
        registeredUsers: totals.registeredUsers ?? null,
        premiumUsers: totals.premiumUsers ?? null,
        freeUsers: totals.freeUsers ?? null,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function computeDashboardSnapshot({ trigger = 'manual', actorEmail = null } = {}) {
  const startedAt = Date.now();
  const { db } = getDialledMtbAdmin();

  const [raw, ga4, history] = await Promise.all([fetchFirestoreSource(db), fetchGa4Metrics(), fetchSnapshotHistory(db)]);

  const snapshot = buildSnapshot(raw, {
    generatedAt: new Date().toISOString(),
    trigger,
    actorEmail,
    ga4,
    history,
  });
  snapshot.durationMs = Date.now() - startedAt;

  const dayKey = snapshot.generatedAt.slice(0, 10);
  const batch = db.batch();
  batch.set(db.collection(SNAPSHOT_COLLECTION).doc(dayKey), snapshot);
  batch.set(db.collection(SNAPSHOT_COLLECTION).doc('latest'), snapshot);
  await batch.commit();

  return snapshot;
}

export async function getLatestDashboardSnapshot() {
  const { db } = getDialledMtbAdmin();
  const doc = await db.collection(SNAPSHOT_COLLECTION).doc('latest').get();
  return doc.exists ? doc.data() : null;
}
