import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  const { testRunId } = params;
  // TODO: read real progress from your store
  return NextResponse.json({ testRunId, progress: 50, running: true });
}
