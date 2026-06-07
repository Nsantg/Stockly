/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: false,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/integration/**/*.integration.test.ts'],
  globalSetup: '<rootDir>/__tests__/integration/setup/globalSetup.ts',
  globalTeardown: '<rootDir>/__tests__/integration/setup/globalTeardown.ts',
  setupFiles: ['<rootDir>/__tests__/integration/setup/loadEnv.ts'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/integration/setup/setupAfterEnv.ts'],
  testTimeout: 60_000,
  maxWorkers: 1,
};
