import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { configType, testRunId } = await request.json();
    if (!configType || !testRunId) {
      return NextResponse.json({ error: 'Missing configType or testRunId' }, { status: 400 });
    }

    const script = path.join(process.cwd(), 'scripts', 'run-jest-tests.js');
    const child = spawn(process.execPath, [script], {
      env: {
        ...process.env,
        CONFIG_TYPE: configType,
        TEST_RUN_ID: testRunId,
        TEST_PROGRESS_DIR: '/tmp/test-progress',
        TEST_REPORTS_DIR: '/tmp/test-reports'
      },
      stdio: 'ignore',
      detached: true
    });
    child.unref();

    return NextResponse.json({ success: true, message: 'Jest run started', testRunId, configType }, { status: 202 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to start tests', details: String(err) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}
