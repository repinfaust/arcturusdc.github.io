import crypto from 'node:crypto';

import { BetaAnalyticsDataClient } from '@google-analytics/data';

import { getSidestandAdmin } from '@/lib/sidestandAdmin';

const GA4_PROPERTY_ID = process.env.SIDESTAND_GA4_PROPERTY_ID || '546046598';
const DAY_MS = 24 * 60 * 60 * 1000;

function toIso(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  return null;
}

function maxIso(values) {
  const valid = values.filter(Boolean).sort();
  return valid[valid.length - 1] || null;
}

function pct(part, whole) {
  return whole ? Math.round((part / whole) * 1000) / 10 : 0;
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function distribution(values, buckets) {
  const counts = buckets.map(() => 0);
  values.forEach((value) => {
    const index = buckets.findIndex(({ min, max }) => value >= min && value <= max);
    counts[index < 0 ? counts.length - 1 : index] += 1;
  });
  return {
    buckets: buckets.map((bucket, index) => ({ label: bucket.label, count: counts[index] })),
    summary: {
      min: values.length ? Math.min(...values) : 0,
      median: median(values),
      mean: values.length ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10 : 0,
      max: values.length ? Math.max(...values) : 0,
    },
  };
}

function riderCode(uid) {
  return `R-${crypto.createHash('sha256').update(String(uid)).digest('hex').slice(0, 6).toUpperCase()}`;
}

function mapDocs(snapshot) {
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function fetchFirestoreData() {
  const { db } = getSidestandAdmin();
  const names = [
    'users',
    'bikes',
    'rides',
    'maintenanceComponents',
    'maintenanceEntries',
    'trips',
    'stops',
    'documents',
    'feedback',
  ];
  const snapshots = await Promise.all(names.map((name) => db.collection(name).get()));
  return Object.fromEntries(names.map((name, index) => [name, mapDocs(snapshots[index])]));
}

async function fetchGa4() {
  try {
    const client = new BetaAnalyticsDataClient();
    const [lifetime, last30d, eventsLifetime, events30d, daily] = await Promise.all([
      client.runReport({
        property: `properties/${GA4_PROPERTY_ID}`,
        dateRanges: [{ startDate: '2026-07-01', endDate: 'today' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      }),
      client.runReport({
        property: `properties/${GA4_PROPERTY_ID}`,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      }),
      client.runReport({
        property: `properties/${GA4_PROPERTY_ID}`,
        dateRanges: [{ startDate: '2026-07-01', endDate: 'today' }],
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit: 50,
      }),
      client.runReport({
        property: `properties/${GA4_PROPERTY_ID}`,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        limit: 50,
      }),
      client.runReport({
        property: `properties/${GA4_PROPERTY_ID}`,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      }),
    ]);

    const metricSummary = (report) => ({
      sessions: Number(report[0]?.rows?.[0]?.metricValues?.[0]?.value || 0),
      activeUsers: Number(report[0]?.rows?.[0]?.metricValues?.[1]?.value || 0),
    });
    const events30Map = new Map((events30d[0].rows || []).map((row) => [
      row.dimensionValues?.[0]?.value,
      Number(row.metricValues?.[0]?.value || 0),
    ]));
    const eventCounts = (eventsLifetime[0].rows || []).map((row) => ({
      eventName: row.dimensionValues?.[0]?.value || 'unknown',
      count: Number(row.metricValues?.[0]?.value || 0),
      last30d: events30Map.get(row.dimensionValues?.[0]?.value) || 0,
    }));

    return {
      available: true,
      propertyId: GA4_PROPERTY_ID,
      lifetime: metricSummary(lifetime),
      last30d: metricSummary(last30d),
      eventCounts,
      dailySessions: (daily[0].rows || []).map((row) => ({
        date: row.dimensionValues?.[0]?.value || '',
        sessions: Number(row.metricValues?.[0]?.value || 0),
      })),
    };
  } catch (error) {
    return {
      available: false,
      propertyId: GA4_PROPERTY_ID,
      error: error?.code === 7
        ? 'The Sidestand service account needs Viewer access to this GA4 property.'
        : 'GA4 data is not available to the dashboard service account yet.',
    };
  }
}

export async function buildSidestandDashboard() {
  const [raw, ga4] = await Promise.all([fetchFirestoreData(), fetchGa4()]);
  const internalUids = new Set(raw.users.filter((user) => Boolean(user.internalType)).map((user) => user.id));
  const users = raw.users.filter((user) => !internalUids.has(user.id));
  const uidSet = new Set(users.map((user) => user.id));
  const real = (items) => items.filter((item) => uidSet.has(item.ownerUid));

  const bikes = real(raw.bikes);
  const rides = real(raw.rides);
  const maintenanceComponents = real(raw.maintenanceComponents);
  const maintenanceEntries = real(raw.maintenanceEntries);
  const trips = real(raw.trips);
  const stops = real(raw.stops);
  const documents = real(raw.documents);
  const feedback = real(raw.feedback);

  const ownerCounts = (items) => {
    const counts = new Map();
    items.forEach((item) => counts.set(item.ownerUid, (counts.get(item.ownerUid) || 0) + 1));
    return counts;
  };
  const bikeCounts = ownerCounts(bikes);
  const rideCounts = ownerCounts(rides);
  const maintenanceCounts = ownerCounts(maintenanceEntries);
  const tripCounts = ownerCounts(trips);
  const stopCounts = ownerCounts(stops);
  const documentCounts = ownerCounts(documents);
  const dueByOwner = new Set(maintenanceComponents.filter((item) => item.isDue).map((item) => item.ownerUid));

  const latestByOwner = new Map();
  [bikes, rides, maintenanceEntries, trips, stops, documents, feedback].flat().forEach((item) => {
    const iso = maxIso([toIso(item.updatedAt), toIso(item.createdAt), toIso(item.rideDate), toIso(item.serviceDate)]);
    if (iso && (!latestByOwner.get(item.ownerUid) || iso > latestByOwner.get(item.ownerUid))) latestByOwner.set(item.ownerUid, iso);
  });

  const now = Date.now();
  const riders = users.map((user) => {
    const lastActiveAt = latestByOwner.get(user.id) || null;
    return {
      code: riderCode(user.id),
      createdAt: toIso(user.createdAt),
      lastActiveAt,
      premium: user.subscription?.isPremium === true,
      bikes: bikeCounts.get(user.id) || 0,
      rides: rideCounts.get(user.id) || 0,
      maintenance: maintenanceCounts.get(user.id) || 0,
      trips: tripCounts.get(user.id) || 0,
      stops: stopCounts.get(user.id) || 0,
      documents: documentCounts.get(user.id) || 0,
      maintenanceDue: dueByOwner.has(user.id),
    };
  }).sort((a, b) => String(b.lastActiveAt || '').localeCompare(String(a.lastActiveAt || '')));

  const created = users
    .map((user) => toIso(user.createdAt))
    .filter(Boolean)
    .sort();
  const registrations = created.map((iso, index) => ({ date: iso.slice(0, 10), count: index + 1 }));
  const active7d = riders.filter((rider) => rider.lastActiveAt && now - new Date(rider.lastActiveAt).getTime() <= 7 * DAY_MS).length;
  const active30d = riders.filter((rider) => rider.lastActiveAt && now - new Date(rider.lastActiveAt).getTime() <= 30 * DAY_MS).length;

  const totals = {
    registeredUsers: users.length,
    internalExcluded: internalUids.size,
    premiumUsers: riders.filter((rider) => rider.premium).length,
    freeUsers: riders.filter((rider) => !rider.premium).length,
    bikes: bikes.filter((bike) => !bike.isArchived).length,
    archivedBikes: bikes.filter((bike) => bike.isArchived).length,
    rides: rides.length,
    maintenanceEntries: maintenanceEntries.length,
    componentsTracked: maintenanceComponents.length,
    tasksDue: maintenanceComponents.filter((item) => item.isDue).length,
    trips: trips.length,
    stops: stops.length,
    documents: documents.length,
    feedback: feedback.length,
    active7d,
    active30d,
  };

  const funnel = [
    ['registered', 'Registered', users.length],
    ['bike_created', 'Bike created', riders.filter((rider) => rider.bikes > 0).length],
    ['odometer_confirmed', 'Odometer confirmed', new Set(bikes.filter((bike) => bike.odometerIsConfirmed === true).map((bike) => bike.ownerUid)).size],
    ['ride_logged', 'Ride logged', riders.filter((rider) => rider.rides > 0).length],
    ['maintenance_logged', 'Maintenance logged', riders.filter((rider) => rider.maintenance > 0).length],
    ['trip_created', 'Trip created', riders.filter((rider) => rider.trips > 0).length],
    ['document_saved', 'Document saved', riders.filter((rider) => rider.documents > 0).length],
  ].map(([stage, label, count]) => ({ stage, label, count, pct: pct(count, users.length) }));

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source: 'sidestand-b19e7',
    totals,
    funnel,
    registrations,
    riders,
    distributions: {
      bikes: distribution(riders.map((rider) => rider.bikes), [{ label: '0', min: 0, max: 0 }, { label: '1', min: 1, max: 1 }, { label: '2', min: 2, max: 2 }, { label: '3+', min: 3, max: Infinity }]),
      rides: distribution(riders.map((rider) => rider.rides), [{ label: '0', min: 0, max: 0 }, { label: '1', min: 1, max: 1 }, { label: '2–5', min: 2, max: 5 }, { label: '6+', min: 6, max: Infinity }]),
      maintenance: distribution(riders.map((rider) => rider.maintenance), [{ label: '0', min: 0, max: 0 }, { label: '1', min: 1, max: 1 }, { label: '2–5', min: 2, max: 5 }, { label: '6+', min: 6, max: Infinity }]),
      documents: distribution(riders.map((rider) => rider.documents), [{ label: '0', min: 0, max: 0 }, { label: '1', min: 1, max: 1 }, { label: '2–3', min: 2, max: 3 }, { label: '4+', min: 4, max: Infinity }]),
    },
    ga4,
  };
}
