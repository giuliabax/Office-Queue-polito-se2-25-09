export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testMatch: [
    '**/tests/**/*.test.mjs',
    '**/tests/**/*.test.js',
  ],
  collectCoverageFrom: [
    'controllers/**/*.mjs',
    'dao/**/*.mjs',
    'utils/**/*.mjs',
    'dto/**/*.mjs',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
  ],
};

