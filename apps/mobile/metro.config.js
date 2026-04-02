const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Add the workspace root to watch folders
config.watchFolders = [workspaceRoot];

// Configure node_modules resolution for monorepo
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Add alias for @finsnap/shared package
config.resolver.extraNodeModules = {
  '@finsnap/shared': path.resolve(workspaceRoot, 'packages/shared/src'),
};

// Disable package exports to avoid issues with monorepo
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
