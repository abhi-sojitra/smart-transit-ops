import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/modules/trip/**/*.(t|j)s',
    '!src/modules/trip/tests/**',
    '!src/modules/trip/trip.module.ts',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@transitops/shared-types$': '<rootDir>/../../packages/shared-types/src/index.ts',
  },
};

export default config;
