import type { Config } from 'jest';

const config: Config = {
  rootDir: '..',
  testMatch: ['<rootDir>/__tests__/**/*.test.{ts,tsx,js}'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  testEnvironment: 'node',
  moduleFileExtensions: ['ts','tsx','js','json'],
  reporters: [
    'default',
    '<rootDir>/__tests__/utils/ProgressReporter.js'
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/.next',
    '<rootDir>/node_modules',
    '<rootDir>/test-progress',
    '<rootDir>/test-reports'
  ],
};

export default config;
