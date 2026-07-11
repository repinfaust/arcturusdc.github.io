import { NextResponse } from 'next/server';

import { computeDashboardSnapshot } from '@/lib/dialledDashboard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const snapshot = await computeDashboardSnapshot({ trigger: 'cron' });
    return NextResponse.json({ ok: true, generatedAt: snapshot.generatedAt, durationMs: snapshot.durationMs });
  } catch (error) {
    console.error('[dialled-dashboard] cron refresh failed', error);
    return NextResponse.json({ error: error?.message || 'Snapshot refresh failed.' }, { status: 500 });
  }
}
