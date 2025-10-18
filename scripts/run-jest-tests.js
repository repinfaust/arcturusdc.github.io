const { spawn } = require('child_process');
const path = require('path');

// Pick up config type and test run ID from environment or defaults
const configType = process.env.CONFIG_TYPE || 'comprehensive';
const testRunId = process.env.TEST_RUN_ID || `run-${Date.now()}`;

// Map test suite names to paths (optional)
const patternMap = {
  comprehensive: '__tests__',
  quick: '__tests__/quick',
  critical: '__tests__/critical'
};
const testPathPattern = patternMap[configType] || '__tests__';

// Resolve Jest binary and config
const jestBin = require.resolve('jest/bin/jest.js');
const jestConfig = path.join(process.cwd(), '__tests__', 'jest.config.ts');

// Spawn Jest as a child process
const child = spawn(
  process.execPath,
  [
    jestBin,
    '--config',
    jestConfig,
    '--runInBand',
    '--testPathPattern',
    testPathPattern
  ],
  {
    cwd: process.cwd(),
    stdio: 'inherit', // shows Jest output in Vercel logs
    env: {
      ...process.env,
      NODE_ENV: 'test',
      TEST_RUN_ID: testRunId,
      CONFIG_TYPE: configType,
      TEST_PROGRESS_DIR: process.env.TEST_PROGRESS_DIR || '/tmp/test-progress',
      TEST_REPORTS_DIR: process.env.TEST_REPORTS_DIR || '/tmp/test-reports'
    }
  }
);

// When Jest exits, propagate the same exit code
child.on('exit', (code) => {
  console.log(`🧪 Jest process finished with code ${code}`);
  process.exit(code ?? 1);
});
