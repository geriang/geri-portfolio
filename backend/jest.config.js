module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  collectCoverageFrom: ['src/import/**/*.ts'],
  coverageThreshold: {
    './src/import/classifier.ts': { lines: 80 },
    './src/import/dayLocal.ts': { lines: 80 },
  },
};
