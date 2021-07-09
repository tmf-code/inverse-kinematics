module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', './example/', './dist/'],
  watchPathIgnorePatterns: ['/node_modules/', './example/', './dist/'],
  setupFilesAfterEnv: ['./tests/setupTests.ts'],
  globals: {
    'ts-jest': {
      tsconfig: './tests/tsconfig.json',
    },
  },
}
