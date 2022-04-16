module.exports = {
  testEnvironment: './env.js',
  roots: ['<rootDir>/test'],
  transform: {
    '^.+\\.(ts|tsx)$': ['@swc-node/jest'],
  },
};
