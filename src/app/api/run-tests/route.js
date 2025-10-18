import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

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

    writeProgress(testRunId, {
      testRunId, status: 'running', progress: 0, passed: 0, failed: 0, startedAt: new Date().toISOString()
    }, PROGRESS_DIR);

    (async () => {
      try {
        const jestConfig = {
          rootDir: path.join(process.cwd(), ''),
          testMatch: ['<rootDir>/__tests__/**/*.test.{ts,tsx,js}'],
          transform: { '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }] },
          testEnvironment: 'node',
          moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
          reporters: ['default', '<rootDir>/__tests__/utils/ProgressReporter.js'],
          modulePathIgnorePatterns: [
            '<rootDir>/.next',
            '<rootDir>/node_modules',
            '<rootDir>/test-progress',
            '<rootDir>/test-reports'
          ]
        };

        const patternMap = { comprehensive: '__tests__', quick: '__tests__/quick', critical: '__tests__/critical' };
        const testPathPattern = patternMap[configType] || '__tests__';

        // Set only the custom env vars the reporter needs
        process.env.TEST_RUN_ID = testRunId;
        process.env.TEST_PROGRESS_DIR = PROGRESS_DIR;
        process.env.TEST_REPORTS_DIR = REPORTS_DIR;
        process.env.CONFIG_TYPE = configType;

        const { runCLI } = await import('jest');

        const result = await runCLI(
          {
            config: JSON.stringify(jestConfig),
            runInBand: true,
            testPathPattern
          },
          [jestConfig.rootDir]
        );

        const finalSummary = {
          passed: result.results.numPassedTests,
          failed: result.results.numFailedTests,
          total:  result.results.numTotalTests,
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
