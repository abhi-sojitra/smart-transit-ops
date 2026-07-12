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
    '!src/modules/driver/**/*.spec.ts',
  ],
  coverageDirectory: './coverage/driver',
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
  },
};

export default config;
