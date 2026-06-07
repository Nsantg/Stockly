/** Configuración Jest exclusiva para la suite BDD (jest-cucumber). */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__bdd__'],
  testMatch: ['**/__bdd__/steps/**/*.steps.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  clearMocks: true,
  verbose: true,
};
