import jpaPresets from 'jest-preset-angular/presets/index.js';
const { createEsmPreset } = jpaPresets;

/** @type {import('jest').Config} */
export default {
  ...createEsmPreset({
    tsconfig: '<rootDir>/tsconfig.spec.json',
  }),
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^lib$': '<rootDir>/src/lib/public-api.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  collectCoverageFrom: [
    'src/lib/**/*.ts',
    '!src/lib/**/*.spec.ts',
    '!src/lib/**/public-api.ts',
  ],
};