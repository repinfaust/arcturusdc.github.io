// src/app/api/run-tests/route.js
import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { randomUUID } from 'crypto';
import { spawn } from 'child_process';
import { createRequire } from 'module';

const SESSION_COOKIE_NAME = '__session';
const require = createRequire(import.meta.url);
const jestPackageJson = require('jest/package.json');
const JEST_PACKAGE_NAME = jestPackageJson.name || 'jest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// --- Helpers ---
function parseJestLine(line) {
  // Very light parsing of Jest verbose output lines to infer progress.
  // Adjust heuristics as needed for your reporter/output.
  const txt = line.toString();
  const isPass = /\bPASS\b/.test(txt);
  const isFail = /\bFAIL\b/.test(txt);
  const isRuns = /\bRUNS\b/.test(txt);
  return { isPass, isFail, isRuns };
}

export async function POST(request) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { auth, db, FieldValue } = getFirebaseAdmin();
    await auth.verifySessionCookie(sessionCookie, true);

    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const configType = typeof body?.configType === 'string' ? body.configType : 'comprehensive';
    const providedTestRunId = typeof body?.testRunId === 'string' ? body.testRunId.trim() : '';
    const testRunId = providedTestRunId || randomUUID();

    const runRef = db.collection('test_runs').doc(testRunId);
    const progressRef = db.collection('test_progress').doc(testRunId);

    await runRef.set({
      id: testRunId,
      createdAt: FieldValue.serverTimestamp(),
      startedAt: FieldValue.serverTimestamp(),
      status: 'running',
      source: 'dashboard',
      config: configType,
    });

    await progressRef.set({
      id: testRunId,
      updatedAt: FieldValue.serverTimestamp(),
      status: 'running',
      percent: 0,
      counts: { total: 0, passed: 0, failed: 0, running: 0 },
      lastLine: '',
    });

    let jestBin;
    try {
      jestBin = require.resolve('jest/bin/jest.js');
    } catch (error) {
      console.error('Failed to resolve jest binary path', error);
      return NextResponse.json(
        { error: 'Failed to start tests', details: `${JEST_PACKAGE_NAME} binary not found on server` },
        { status: 500 },
      );
    }
    const args = ['--runInBand', '--verbose', '--reporters=default', '--colors'];

    const child = spawn('node', [jestBin, ...args], {
      env: {
        ...process.env,
        FORCE_COLOR: '1',
        CONFIG_TYPE: configType,
        TEST_RUN_ID: testRunId,
      },
      cwd: process.cwd(),
    });

    const state = {
      total: 0,
      passed: 0,
      failed: 0,
      running: 0,
    };

    const bumpProgress = async (lastLine) => {
      const done = state.passed + state.failed;
      const denom = state.total > 0 ? state.total : Math.max(1, done + state.running);
      const percent = Math.max(0, Math.min(100, Math.round((done / denom) * 100)));

      try {
        await progressRef.update({
          updatedAt: FieldValue.serverTimestamp(),
          status: 'running',
          percent,
          counts: { ...state },
          lastLine,
        });
      } catch (error) {
        console.error('Failed to update test progress', error);
      }
    };

    child.stdout.on('data', async (chunk) => {
      const lines = chunk.toString().split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        const { isPass, isFail, isRuns } = parseJestLine(line);

        if (isRuns) state.running += 1;
        if (isPass) {
          state.passed += 1;
          state.running = Math.max(0, state.running - 1);
        }
        if (isFail) {
          state.failed += 1;
          state.running = Math.max(0, state.running - 1);
        }

        if (state.total === 0 && (isRuns || isPass || isFail)) {
          state.total = Math.max(state.total, state.running + state.passed + state.failed);
        }

        await bumpProgress(line);
      }
    });

    child.stderr.on('data', async (chunk) => {
      await bumpProgress(chunk.toString());
    });

    child.on('close', async (code) => {
      const finishedStatus = code === 0 ? 'completed' : 'failed';
      const done = state.passed + state.failed;

      try {
        const resultsRef = db.collection('test_results').doc(testRunId);
        await resultsRef.set({
          id: testRunId,
          finishedAt: FieldValue.serverTimestamp(),
          status: finishedStatus,
          summary: {
            total: state.total || done,
            passed: state.passed,
            failed: state.failed,
          },
        });

        await progressRef.update({
          updatedAt: FieldValue.serverTimestamp(),
          status: finishedStatus,
          percent: 100,
          counts: { ...state },
        });

        await runRef.update({
          status: finishedStatus,
          finishedAt: FieldValue.serverTimestamp(),
          exitCode: code,
        });
      } catch (error) {
        console.error('Failed to finalize test run', error);
      }
    });

    return NextResponse.json(
      { message: 'Jest run started', testRunId, configType },
      { status: 202 }
    );
  } catch (err) {
    console.error('run-tests error', err);
    return NextResponse.json(
      { error: 'Failed to start tests', details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
