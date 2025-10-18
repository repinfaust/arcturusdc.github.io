import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const PROGRESS_DIR = process.env.TEST_PROGRESS_DIR || '/tmp/test-progress';
    const file = path.join(PROGRESS_DIR, `${params.id}.json`);
    if (!fs.existsSync(file)) {
      // Return a safe placeholder so the UI doesn't crash
      return NextResponse.json(
        { testRunId: params.id, progress: 0, running: true, status: 'running' },
        { status: 200 }
      );
    }
    const json = JSON.parse(fs.readFileSync(file, 'utf8'));
    return NextResponse.json(json);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'read failed' }, { status: 500 });
  }
}
