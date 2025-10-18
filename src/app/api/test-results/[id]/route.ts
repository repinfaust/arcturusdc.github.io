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
    const REPORTS_DIR = process.env.TEST_REPORTS_DIR || '/tmp/test-reports';
    const file = path.join(REPORTS_DIR, `${params.id}.json`);
    if (!fs.existsSync(file)) {
      return NextResponse.json({ testRunId: params.id, ready: false }, { status: 200 });
    }
    const json = JSON.parse(fs.readFileSync(file, 'utf8'));
    return NextResponse.json(json);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'read failed' }, { status: 500 });
  }
}
