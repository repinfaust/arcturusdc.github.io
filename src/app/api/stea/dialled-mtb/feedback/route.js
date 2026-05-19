import { NextResponse } from 'next/server';
import { createFeedbackScreenshotUrl, getDialledMtbAdmin } from '@/lib/dialledMtbAdmin';
import { verifySteaWorkspaceAccess } from '@/lib/steaAccessServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_STATUSES = new Set(['new', 'reviewing', 'planned', 'done', 'wont_do']);
const VALID_PRIORITIES = new Set(['unset', 'low', 'medium', 'high', 'urgent']);
const VALID_TYPES = new Set(['bug', 'confusing', 'idea', 'setup_accuracy', 'strava', 'other']);
const REQUIRED_WORKSPACE = 'Dialled MTB';

function json(body, status = 200) {
  return NextResponse.json(body, { status });
}

function parseDate(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return null;
}

function normalizeFeedbackDoc(doc) {
  const data = doc.data() || {};
  return {
    id: doc.id,
    uid: data.uid || null,
    email: data.email || null,
    displayName: data.displayName || null,
    type: data.type || 'other',
    status: data.status || 'new',
    priority: data.priority || 'unset',
    message: data.message || '',
    testerRelease: Boolean(data.testerRelease),
    screen: data.screen || null,
    routeName: data.routeName || null,
    appVersion: data.appVersion || null,
    buildNumber: data.buildNumber || null,
    platform: data.platform || null,
    deviceModel: data.deviceModel || null,
    osVersion: data.osVersion || null,
    activeBikeId: data.activeBikeId || null,
    activeBikeName: data.activeBikeName || null,
    stravaConnected: typeof data.stravaConnected === 'boolean' ? data.stravaConnected : null,
    premium: typeof data.premium === 'boolean' ? data.premium : null,
    lastClientEvent: data.lastClientEvent || null,
    screenshotPath: data.screenshotPath || null,
    adminNotes: data.adminNotes || '',
    reviewedBy: data.reviewedBy || null,
    createdAt: parseDate(data.createdAt),
    updatedAt: parseDate(data.updatedAt),
    reviewedAt: parseDate(data.reviewedAt),
    resolvedAt: parseDate(data.resolvedAt),
  };
}

function applyFilters(items, searchParams) {
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  const type = searchParams.get('type');
  const platform = searchParams.get('platform');
  const hasScreenshot = searchParams.get('hasScreenshot');
  const q = (searchParams.get('q') || '').trim().toLowerCase();

  return items.filter((item) => {
    if (status && item.status !== status) return false;
    if (priority && item.priority !== priority) return false;
    if (type && item.type !== type) return false;
    if (platform && item.platform !== platform) return false;
    if (hasScreenshot === 'true' && !item.screenshotPath) return false;
    if (hasScreenshot === 'false' && item.screenshotPath) return false;
    if (q) {
      const haystack = [
        item.message,
        item.email,
        item.displayName,
        item.screen,
        item.routeName,
        item.activeBikeName,
        item.deviceModel,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

function buildSummary(items) {
  const summary = {
    total: items.length,
    open: 0,
    urgent: 0,
    screenshots: 0,
    byStatus: {},
    byPriority: {},
    byType: {},
    byPlatform: {},
  };

  for (const item of items) {
    if (!['done', 'wont_do'].includes(item.status)) summary.open += 1;
    if (item.priority === 'urgent') summary.urgent += 1;
    if (item.screenshotPath) summary.screenshots += 1;
    summary.byStatus[item.status] = (summary.byStatus[item.status] || 0) + 1;
    summary.byPriority[item.priority] = (summary.byPriority[item.priority] || 0) + 1;
    summary.byType[item.type] = (summary.byType[item.type] || 0) + 1;
    if (item.platform) summary.byPlatform[item.platform] = (summary.byPlatform[item.platform] || 0) + 1;
  }

  return summary;
}

export async function GET(request) {
  const url = new URL(request.url);
  const tenantId = url.searchParams.get('tenantId') || '';
  const access = await verifySteaWorkspaceAccess(request, { tenantId, requiredWorkspaceName: REQUIRED_WORKSPACE });

  if (!access.ok) {
    return json({ error: access.error }, access.status);
  }

  try {
    const { db, storage } = getDialledMtbAdmin();
    const limit = Math.min(Number(url.searchParams.get('limit')) || 150, 250);
    const snapshot = await db.collection('feedback').orderBy('createdAt', 'desc').limit(limit).get();
    const allItems = snapshot.docs.map(normalizeFeedbackDoc);
    const filteredItems = applyFilters(allItems, url.searchParams);

    const items = await Promise.all(
      filteredItems.map(async (item) => ({
        ...item,
        screenshotUrl: await createFeedbackScreenshotUrl(storage, item.screenshotPath),
      })),
    );

    return json({
      items,
      summary: buildSummary(allItems),
      filteredSummary: buildSummary(filteredItems),
      refreshedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[dialled-feedback] list failed', error);
    return json({ error: error?.message || 'Could not load Dialled MTB feedback.' }, 500);
  }
}

export async function PATCH(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const access = await verifySteaWorkspaceAccess(request, { tenantId: body?.tenantId, requiredWorkspaceName: REQUIRED_WORKSPACE });
  if (!access.ok) {
    return json({ error: access.error }, access.status);
  }

  const id = typeof body?.id === 'string' ? body.id.trim() : '';
  if (!id || id.includes('/')) {
    return json({ error: 'Valid feedback id is required.' }, 400);
  }

  const { db, FieldValue } = getDialledMtbAdmin();
  const updates = {};

  if (body.status !== undefined) {
    if (!VALID_STATUSES.has(body.status)) return json({ error: 'Invalid status.' }, 400);
    updates.status = body.status;
    updates.reviewedAt = FieldValue.serverTimestamp();
    updates.reviewedBy = access.user.email;
    if (['done', 'wont_do'].includes(body.status)) {
      updates.resolvedAt = FieldValue.serverTimestamp();
    }
  }

  if (body.priority !== undefined) {
    if (!VALID_PRIORITIES.has(body.priority)) return json({ error: 'Invalid priority.' }, 400);
    updates.priority = body.priority;
    updates.reviewedAt = FieldValue.serverTimestamp();
    updates.reviewedBy = access.user.email;
  }

  if (body.type !== undefined) {
    if (!VALID_TYPES.has(body.type)) return json({ error: 'Invalid type.' }, 400);
    updates.type = body.type;
  }

  if (body.adminNotes !== undefined) {
    if (typeof body.adminNotes !== 'string') return json({ error: 'Invalid admin notes.' }, 400);
    if (body.adminNotes.length > 2000) return json({ error: 'Admin notes are too long.' }, 400);
    updates.adminNotes = body.adminNotes;
    updates.reviewedAt = FieldValue.serverTimestamp();
    updates.reviewedBy = access.user.email;
  }

  if (Object.keys(updates).length === 0) {
    return json({ error: 'No supported triage fields supplied.' }, 400);
  }

  updates.updatedAt = FieldValue.serverTimestamp();

  try {
    await db.collection('feedback').doc(id).set(updates, { merge: true });
    return json({ status: 'ok', id });
  } catch (error) {
    console.error('[dialled-feedback] update failed', error);
    return json({ error: error?.message || 'Could not update feedback.' }, 500);
  }
}
