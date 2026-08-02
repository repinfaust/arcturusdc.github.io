import { NextResponse } from 'next/server';

import { buildSidestandDashboard } from '@/lib/sidestandDashboard';
import { verifySteaWorkspaceAccess } from '@/lib/steaAccessServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ADMIN_ROLES = new Set(['super_admin', 'admin']);

async function requireAdmin(request, tenantId) {
  const access = await verifySteaWorkspaceAccess(request, {
    tenantId,
    allowedWorkspaceNames: ['Sidestand', 'ArcturusDC'],
  });
  if (!access.ok) return access;
  if (!ADMIN_ROLES.has(access.user.role)) return { ok: false, status: 403, error: 'Workspace admin access is required.' };
  return access;
}

export async function GET(request) {
  const url = new URL(request.url);
  const access = await requireAdmin(request, url.searchParams.get('tenantId') || '');
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  try {
    return NextResponse.json({ snapshot: await buildSidestandDashboard() });
  } catch (error) {
    console.error('[sidestand-dashboard] load failed', error);
    return NextResponse.json({ error: error?.message || 'Could not load Sidestand analytics.' }, { status: 500 });
  }
}
