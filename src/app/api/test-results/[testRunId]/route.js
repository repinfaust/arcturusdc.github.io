import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  const { testRunId } = params;
  // TODO: return real results
  return NextResponse.json({
    testRunId,
    status: 'complete',
    summary: { passed: 89, failed: 1, successRate: 98.9 },
  });
}
