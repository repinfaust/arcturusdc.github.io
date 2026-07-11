import { NextResponse } from 'next/server';

import { computeDashboardSnapshot, getLatestDashboardSnapshot } from '@/lib/dialledDashboard';
import { verifySteaWorkspaceAccess } from '@/lib/steaAccessServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ALLOWED_WORKSPACES = ['Dialled MTB', 'ArcturusDC'];
const ADMIN_ROLES = new Set(['super_admin', 'admin']);

function json(body, status = 200) {
  return NextResponse.json(body, { status });
}

async function requireDashboardAdmin(request, tenantId) {
  const access = await verifySteaWorkspaceAccess(request, {
    tenantId,
    allowedWorkspaceNames: ALLOWED_WORKSPACES,
  });
  if (!access.ok) return access;
  if (!ADMIN_ROLES.has(access.user.role)) {
    return { ok: false, status: 403, error: 'Workspace admin access is required.' };
  }
  return access;
}

export async function GET(request) {
  const url = new URL(request.url);
  const access = await requireDashboardAdmin(request, url.searchParams.get('tenantId') || '');
  if (!access.ok) return json({ error: access.error }, access.status);

  try {
    let snapshot = await getLatestDashboardSnapshot();
    if (!snapshot) {
      snapshot = await computeDashboardSnapshot({ trigger: 'manual', actorEmail: access.user.email });
    }
    return json({ snapshot });
  } catch (error) {
    console.error('[dialled-dashboard] load failed', error);
    return json({ error: error?.message || 'Could not load the dashboard snapshot.' }, 500);
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const access = await requireDashboardAdmin(request, body?.tenantId);
  if (!access.ok) return json({ error: access.error }, access.status);

  try {
    const snapshot = await computeDashboardSnapshot({ trigger: 'manual', actorEmail: access.user.email });
    return json({ snapshot });
  } catch (error) {
    console.error('[dialled-dashboard] refresh failed', error);
    return json({ error: error?.message || 'Could not refresh the dashboard snapshot.' }, 500);
  }
}
