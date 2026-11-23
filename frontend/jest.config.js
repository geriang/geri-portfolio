/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  // tsconfig.jest.json compiles JSX to React calls and emits CommonJS; the app
  // tsconfig keeps `jsx: preserve` for Next itself.
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      { tsconfig: '<rootDir>/tsconfig.jest.json' },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testPathIgnorePatterns: ['<rootDir>/tests/e2e/'],
};
