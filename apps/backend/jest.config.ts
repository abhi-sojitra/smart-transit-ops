import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/modules/driver/service/**/*.(t|j)s',
    'src/modules/driver/repository/**/*.(t|j)s',
    'src/modules/driver/controller/**/*.(t|j)s',
    'src/modules/fleet/service/**/*.(t|j)s',
    'src/modules/fleet/repository/**/*.(t|j)s',
    'src/modules/fleet/controller/**/*.(t|j)s',
    'src/modules/fuel/**/*.(t|j)s',
    'src/modules/expense/**/*.(t|j)s',
    'src/modules/trip/**/*.(t|j)s',
    'src/repositories/fuel.repository.ts',
    'src/repositories/expense.repository.ts',
    '!src/modules/driver/**/*.spec.ts',
    '!src/modules/fleet/**/*.spec.ts',
    '!src/modules/trip/tests/**',
    '!src/modules/trip/trip.module.ts',
    '!**/*.module.ts',
    '!**/dto/**',
    '!**/*.mapper.ts',
  ],
  coverageDirectory: './coverage',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@transitops/shared-types$': '<rootDir>/../../packages/shared-types/dist/index.js',
  },
};

export default config;
