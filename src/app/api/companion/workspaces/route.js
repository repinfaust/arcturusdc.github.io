import { NextResponse } from 'next/server';
import { verifyCompanionUser, listAccessibleTenants } from '@/lib/companion/companionAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * GET /api/companion/workspaces
 * Returns the tenants (workspaces) the authenticated user can access.
 * Auth: Bearer Firebase ID token. (spec §3 Option B, AC14)
 */
export async function GET(request) {
  const auth = await verifyCompanionUser(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const tenants = await listAccessibleTenants(auth.user);
    const workspaces = tenants.map((t) => ({
      id: t.id,
      name: t.name || 'Untitled workspace',
      plan: t.plan || null,
    }));
    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error('[companion/workspaces]', error?.message);
    return NextResponse.json({ error: 'Failed to load workspaces.' }, { status: 500 });
  }
}
