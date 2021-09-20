module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/test'],
  transform: {
    '^.+\\.(ts|tsx)$': '@swc-node/jest',
  }
};
