import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// IMPORTANT for Vercel background work + long runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // up to 5 minutes. raise if needed.

function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

function writeProgress(id, data, dir) {
  ensureDir(dir);
  fs.writeFileSync(path.join(dir, `${id}.json`), JSON.stringify(data, null, 2));
}

export async function POST(request) {
  try {
    const { configType, testRunId } = await request.json();
    if (!configType || !testRunId) {
      return NextResponse.json({ error: 'Missing configType or testRunId' }, { status: 400 });
    }

    const PROGRESS_DIR = process.env.TEST_PROGRESS_DIR || '/tmp/test-progress';
    const REPORTS_DIR  = process.env.TEST_REPORTS_DIR  || '/tmp/test-reports';

    // write initial progress so UI shows "running"
    writeProgress(testRunId, {
      testRunId, status: 'running', progress: 0, passed: 0, failed: 0, startedAt: new Date().toISOString()
    }, PROGRESS_DIR);

    // KICK OFF JEST IN-PROCESS (no spawn). Do not await — let it run in background.
    (async () => {
      try {
        // Build a Jest config inline (same as your jest.config.ts)
        const jestConfig = {
          rootDir: path.join(process.cwd(), ''),
          testMatch: ['<rootDir>/__tests__/**/*.test.{ts,tsx,js}'],
          transform: { '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }] },
          testEnvironment: 'node',
          moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
          reporters: [
            'default',
            '<rootDir>/__tests__/utils/ProgressReporter.js'
          ],
          modulePathIgnorePatterns: [
            '<rootDir>/.next',
            '<rootDir>/node_modules',
            '<rootDir>/test-progress',
            '<rootDir>/test-reports'
          ]
        };

        // Map suite name to path pattern
        const patternMap = { comprehensive: '__tests__', quick: '__tests__/quick', critical: '__tests__/critical' };
        const testPathPattern = patternMap[configType] || '__tests__';

        // Make sure our reporter sees the dirs + IDs
        process.env.TEST_RUN_ID = testRunId;
        process.env.TEST_PROGRESS_DIR = PROGRESS_DIR;
        process.env.TEST_REPORTS_DIR = REPORTS_DIR;
        process.env.CONFIG_TYPE = configType;
        process.env.NODE_ENV = 'test';

        // Import jest programmatic API
        const { runCLI } = await import('jest');

        // runCLI expects a JSON-stringified config
        const result = await runCLI(
          {
            // serialize so jest doesn't look for a file
            config: JSON.stringify(jestConfig),
            runInBand: true,
            testPathPattern
          },
          [jestConfig.rootDir]
        );

        // If our ProgressReporter didn’t write a final file for some reason, write one now.
        const finalSummary = {
          passed: result.results.numPassedTests,
          failed: result.results.numFailedTests,
          total: result.results.numTotalTests,
          successRate: result.results.numTotalTests
            ? (result.results.numPassedTests / result.results.numTotalTests) * 100
            : 0
        };

        ensureDir(REPORTS_DIR);
        fs.writeFileSync(
          path.join(REPORTS_DIR, `${testRunId}.json`),
          JSON.stringify({ testRunId, summary: finalSummary, results: result.results }, null, 2)
        );

        writeProgress(testRunId, {
          testRunId,
          status: finalSummary.failed > 0 ? 'failed' : 'completed',
          progress: 100,
          passed: finalSummary.passed,
          failed: finalSummary.failed,
          completed: true
        }, PROGRESS_DIR);
      } catch (err) {
        // Fatal error: mark as failed so UI doesn’t hang at 0%
        writeProgress(testRunId, {
          testRunId,
          status: 'failed',
          progress: 100,
          passed: 0,
          failed: 1,
          error: (err && err.message) || String(err),
          completed: true
        }, PROGRESS_DIR);
      }
    })();

    // Respond immediately; background continues
    const headers = new Headers();
    headers.set('x-vercel-background', '1');

    return new NextResponse(
      JSON.stringify({ success: true, message: 'Jest run started', testRunId, configType }),
      { status: 202, headers }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to start tests', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}
