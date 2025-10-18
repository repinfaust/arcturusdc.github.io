const path = require('path');
const jestCli = require('jest-cli');

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

const jestConfig = path.join(process.cwd(), '__tests__', 'jest.config.ts');

const argv = process.argv.slice(2);

if (!argv.includes('--config')) {
  argv.push('--config', jestConfig);
}

if (!argv.includes('--runInBand')) {
  argv.push('--runInBand');
}

if (!argv.some((arg) => arg.startsWith('--testPathPattern'))) {
  argv.push('--testPathPattern', testPathPattern);
}

if (!argv.includes('--reporters=default')) {
  argv.push('--reporters=default');
}

if (!argv.includes('--colors')) {
  argv.push('--colors');
}

if (!argv.includes('--verbose')) {
  argv.push('--verbose');
}

// Ensure env variables propagate for reporters
process.env.NODE_ENV = 'test';
process.env.TEST_RUN_ID = testRunId;
process.env.CONFIG_TYPE = configType;
process.env.TEST_PROGRESS_DIR = process.env.TEST_PROGRESS_DIR || '/tmp/test-progress';
process.env.TEST_REPORTS_DIR = process.env.TEST_REPORTS_DIR || '/tmp/test-reports';

jestCli
  .run(argv, process.cwd())
  .then(({ results }) => {
    console.log('🧪 Jest run complete with', results.numFailedTests, 'failed tests');
    process.exit(results.success ? 0 : 1);
  })
  .catch((error) => {
    console.error('🧪 Jest run failed', error);
    process.exit(1);
  });
