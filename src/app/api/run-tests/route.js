import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const testRunId = body.testRunId || crypto.randomUUID();
  // TODO: kick off orchestrator here
  return NextResponse.json({ ok: true, testRunId }, { status: 202 });
}

// Optional: make GET clearly not allowed (helps debugging vs 404)
export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}
