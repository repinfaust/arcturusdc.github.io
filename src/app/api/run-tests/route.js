// src/app/api/run-tests/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
  doc, setDoc, updateDoc, serverTimestamp, collection
} from 'firebase/firestore';

import { randomUUID } from 'crypto';
import { spawn } from 'child_process';

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

export async function POST() {
  try {
    const testRunId = randomUUID();

    // Create run + progress docs up-front
    const runRef = doc(collection(db, 'test_runs'), testRunId);
    const progressRef = doc(collection(db, 'test_progress'), testRunId);

    await setDoc(runRef, {
      id: testRunId,
      createdAt: serverTimestamp(),
      startedAt: serverTimestamp(),
      status: 'running', // queued | running | completed | failed
      source: 'dashboard',
    });

    await setDoc(progressRef, {
      id: testRunId,
      updatedAt: serverTimestamp(),
      status: 'running',
      percent: 0,
      counts: { total: 0, passed: 0, failed: 0, running: 0 },
      lastLine: '',
    });

    // Spawn Jest in-band so we can read stdout
    // Tweak args to your needs (e.g., patterns)
    const jestBin = 'node_modules/jest/bin/jest.js';
    const args = ['--runInBand', '--verbose', '--reporters=default', '--colors'];

    const child = spawn('node', [jestBin, ...args], {
      env: { ...process.env, FORCE_COLOR: '1' },
      cwd: process.cwd(),
    });

    // Track rough counts
    const state = {
      total: 0,     // if you know total ahead of time, set it; else we approximate
      passed: 0,
      failed: 0,
      running: 0,
    };

    // Optional: if you emit your own "TOTAL n" line before running, capture it here.
    // Otherwise, total remains 0 and percent will be based on (passed+failed) only.

    const bumpProgress = async (lastLine) => {
      const done = state.passed + state.failed;
      const denom = state.total > 0 ? state.total : Math.max(1, done + state.running);
      const percent = Math.max(0, Math.min(100, Math.round((done / denom) * 100)));

      await updateDoc(progressRef, {
        updatedAt: serverTimestamp(),
        status: 'running',
        percent,
        counts: { ...state },
        lastLine,
      });
    };

    child.stdout.on('data', async (chunk) => {
      const lines = chunk.toString().split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        const { isPass, isFail, isRuns } = parseJestLine(line);

        if (isRuns) state.running += 1;
        if (isPass) { state.passed += 1; state.running = Math.max(0, state.running - 1); }
        if (isFail) { state.failed += 1; state.running = Math.max(0, state.running - 1); }

        // If you can infer total, set state.total once.
        // Example heuristic: when first RUNS appears, set total to running+passed+failed
        if (state.total === 0 && (isRuns || isPass || isFail)) {
          state.total = Math.max(state.total, state.running + state.passed + state.failed);
        }

        await bumpProgress(line);
      }
    });

    child.stderr.on('data', async (chunk) => {
      // Still update lastLine so the UI can surface issues
      await bumpProgress(chunk.toString());
    });

    child.on('close', async (code) => {
      const finishedStatus = code === 0 ? 'completed' : 'failed';
      const done = state.passed + state.failed;
      const percent = 100;

      // Write final results in a separate collection
      const resultsRef = doc(collection(db, 'test_results'), testRunId);
      await setDoc(resultsRef, {
        id: testRunId,
        finishedAt: serverTimestamp(),
        status: finishedStatus,
        summary: {
          total: state.total || done,
          passed: state.passed,
          failed: state.failed,
        },
      });

      // Final progress snapshot
      await updateDoc(progressRef, {
        updatedAt: serverTimestamp(),
        status: finishedStatus,
        percent,
        counts: { ...state },
      });

      // Update run record
      await updateDoc(runRef, {
        status: finishedStatus,
        finishedAt: serverTimestamp(),
        exitCode: code,
      });
    });

    // Return 202 immediately so the dashboard can start polling Firestore-backed APIs
    return NextResponse.json(
      { message: 'Jest run started', testRunId },
      { status: 202 },
    );
  } catch (err) {
    console.error('run-tests error', err);
    return NextResponse.json(
      { error: 'Failed to start tests', details: String(err?.message || err) },
      { status: 500 },
    );
  }
}
