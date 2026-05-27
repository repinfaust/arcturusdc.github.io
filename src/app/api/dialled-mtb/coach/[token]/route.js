import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// DIALLED_FUNCTIONS_URL = base URL of deployed Cloud Functions, e.g.
// https://us-central1-dialledmtb-ea850.cloudfunctions.net
// Set in Vercel env vars. Verify region against Firebase Console before deploying
// (code deploys us-central1; user has stated europe-west2 — D-098).
function functionsBase() {
  const base = process.env.DIALLED_FUNCTIONS_URL;
  if (!base) throw new Error('DIALLED_FUNCTIONS_URL is not set');
  return base.replace(/\/$/, '');
}

export async function GET(_req, { params }) {
  const { token } = params;

  let upstream;
  try {
    upstream = await fetch(`${functionsBase()}/getSnapshot?token=${encodeURIComponent(token)}`, {
      headers: { 'Cache-Control': 'no-store' },
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ status: 'error' }, { status: 502 });
  }

  const body = await upstream.json();
  return NextResponse.json(body, { status: upstream.status });
}
