import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function functionsBase() {
  const base = process.env.DIALLED_FUNCTIONS_URL;
  if (!base) throw new Error('DIALLED_FUNCTIONS_URL is not set');
  return base.replace(/\/$/, '');
}

// Lightweight poll endpoint — returns only { status, snapshotStateVersion }
// so the coach page can detect a refreshSnapshot without fetching the full payload.
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
  return NextResponse.json(
    { status: body.status, snapshotStateVersion: body.data?.snapshotStateVersion ?? null },
    { status: upstream.status },
  );
}
