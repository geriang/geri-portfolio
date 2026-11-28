module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  collectCoverageFrom: ['src/import/**/*.ts', 'src/activity/**/*.ts'],
  coverageThreshold: {
    './src/import/classifier.ts': { lines: 80 },
    './src/import/dayLocal.ts': { lines: 80 },
    './src/import/runImport.ts': { lines: 80 },
    './src/import/cli.ts': { lines: 80 },
    './src/import/sourceCopy.ts': { lines: 80 },
    './src/import/adapters/opencodeAdapter.ts': { lines: 80 },
    './src/activity/timeRange.ts': { lines: 80 },
    './src/activity/activityService.ts': { lines: 80 },
  },
};
