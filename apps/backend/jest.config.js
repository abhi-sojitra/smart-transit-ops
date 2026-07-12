/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'modules/fuel/**/*.(t|j)s',
    'modules/expense/**/*.(t|j)s',
    'repositories/fuel.repository.ts',
    'repositories/expense.repository.ts',
    '!**/*.module.ts',
    '!**/dto/**',
    '!**/*.mapper.ts',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
