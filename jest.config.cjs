const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const tsconfigPath = path.join(rootDir, 'tsconfig.json');

const tsJestOptions = fs.existsSync(tsconfigPath)
  ? { tsconfig: tsconfigPath }
  : {
      tsconfig: {
        allowJs: true,
        esModuleInterop: true,
        isolatedModules: true,
        resolveJsonModule: true,
        strict: false,
        module: 'commonjs',
        target: 'ES2019',
        types: ['node', 'jest'],
      },
    };

/** @type {import('jest').Config} */
module.exports = {
  rootDir,
  testEnvironment: 'node',
  passWithNoTests: true,
  testMatch: ['<rootDir>/__tests__/**/*.test.@(ts|tsx|js)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  modulePathIgnorePatterns: [
    '<rootDir>/.next',
    '<rootDir>/node_modules',
    '<rootDir>/test-progress',
    '<rootDir>/test-reports',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', tsJestOptions],
  },
  reporters: ['default', '<rootDir>/__tests__/utils/ProgressReporter.js'],
};
