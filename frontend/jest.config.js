/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    // Use a jest-specific tsconfig: the app tsconfig sets jsx:"preserve" for
    // Next.js, which leaves JSX uncompiled and breaks ts-jest. This file sets
    // jsx:"react-jsx" so the unit suite can parse .tsx files.
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testPathIgnorePatterns: ['<rootDir>/tests/e2e/'],
};
