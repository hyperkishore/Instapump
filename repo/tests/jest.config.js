module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/*.test.js'],
  setupFilesAfterEnv: ['./setup.js'],
  verbose: true,
  collectCoverageFrom: [
    '../userscript/**/*.js',
    '!**/node_modules/**'
  ]
};
