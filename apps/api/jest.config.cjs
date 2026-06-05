/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@common/(.*)$': '<rootDir>/common/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
    '^@infrastructure/(.*)$': '<rootDir>/infrastructure/$1',
    '^@modules/(.*)$': '<rootDir>/modules/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@generated/(.*)$': '<rootDir>/generated/$1',
  },
};
