import { NextResponse } from 'next/server';

import { getDialledMtbAdmin } from '@/lib/dialledMtbAdmin';
import { verifySteaWorkspaceAccess } from '@/lib/steaAccessServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

// Deliberately bypasses the daily dashboard snapshot (computeDashboardSnapshot
// reads ~10 full collections + calls GA4) — this is a direct, cheap equality
// query against just the users currently in a Strava sync error state, meant
// to be polled frequently for near-real-time visibility.
export async function GET(request) {
  const url = new URL(request.url);
  const access = await requireDashboardAdmin(request, url.searchParams.get('tenantId') || '');
  if (!access.ok) return json({ error: access.error }, access.status);

  try {
    const { db } = getDialledMtbAdmin();
    const snap = await db.collection('users').where('lastStravaSyncStatus', '==', 'error').get();
    const users = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        lastStravaSyncStatus: data.lastStravaSyncStatus ?? null,
        lastStravaSyncMessage: data.lastStravaSyncMessage ?? null,
        lastStravaSyncAt: data.lastStravaSyncAt?.toDate?.()?.toISOString() ?? null,
      };
    });
    return json({ users });
  } catch (error) {
    console.error('[dialled-dashboard] strava-errors failed', error);
    return json({ error: error?.message || 'Could not load Strava sync errors.' }, 500);
  }
}
