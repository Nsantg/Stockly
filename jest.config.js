module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    collectCoverage: true,
    coverageDirectory: 'coverage',
    globals: {
      'ts-jest': {
        tsconfig: 'tsconfig.jest.json',
      },
    },
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1',
      '^socket\\.io$': '<rootDir>/__mocks__/socket.io.js',
      '^socket\\.io-client$': '<rootDir>/__mocks__/socket.io-client.js',
    },
    testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
    testPathIgnorePatterns: ['/node_modules/', '__tests__/integration/'],
    coveragePathIgnorePatterns: ['/node_modules/', 'src/lib/cloudinary\\.ts'],
  };