const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add the parent types directory to watchFolders
config.watchFolders = [
  path.resolve(__dirname, '../types'),
];

// Add resolver for the @shared alias
config.resolver.extraNodeModules = {
  '@shared': path.resolve(__dirname, '../types'),
};


// Make sure Metro can resolve the types directory
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, '../node_modules'),
];

// No need to block style files - expo-router handles route filtering

module.exports = config;