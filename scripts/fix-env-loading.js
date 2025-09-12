#!/usr/bin/env node
/**
 * Troubleshooting script for environment variable loading issues
 * Run this script to diagnose and fix Firebase API key errors
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Diagnosing environment variable loading issues...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  console.log('   Please create a .env file in the root directory');
  process.exit(1);
}

console.log('✅ .env file found');

// Read and validate Firebase config
const envContent = fs.readFileSync(envPath, 'utf-8');
const firebaseKeys = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID'
];

let missingKeys = [];
let foundKeys = {};

for (const key of firebaseKeys) {
  const regex = new RegExp(`^${key}=(.+)$`, 'm');
  const match = envContent.match(regex);
  if (match) {
    foundKeys[key] = match[1].trim();
    // Check if it's a placeholder value
    if (match[1].includes('your-') || match[1].includes('example')) {
      console.warn(`⚠️  ${key} appears to be a placeholder value: ${match[1]}`);
    }
  } else {
    missingKeys.push(key);
  }
}

if (missingKeys.length > 0) {
  console.error('❌ Missing Firebase environment variables:');
  missingKeys.forEach(key => console.log(`   - ${key}`));
  process.exit(1);
}

console.log('✅ All Firebase environment variables are present\n');

// Display current values (masked for security)
console.log('📝 Current Firebase configuration:');
Object.entries(foundKeys).forEach(([key, value]) => {
  const masked = value.substring(0, 10) + '...' + value.substring(value.length - 4);
  console.log(`   ${key}: ${masked}`);
});

console.log('\n🧹 Clearing caches...\n');

// Clear various caches
const commands = [
  {
    name: 'Expo cache',
    command: 'npx expo start -c',
    skipExecution: true,
    message: 'Run: npx expo start -c'
  },
  {
    name: 'Metro bundler cache',
    command: 'rm -rf node_modules/.cache/metro-*',
    skipExecution: false
  },
  {
    name: 'React Native cache',
    command: 'rm -rf $TMPDIR/react-* && rm -rf $TMPDIR/metro-*',
    skipExecution: false
  },
  {
    name: 'Watchman cache',
    command: 'watchman watch-del-all',
    skipExecution: false,
    optional: true
  },
  {
    name: 'NPM cache',
    command: 'npm cache clean --force',
    skipExecution: false
  }
];

for (const { name, command, skipExecution, message, optional } of commands) {
  try {
    if (skipExecution) {
      console.log(`ℹ️  ${name}: ${message}`);
    } else {
      console.log(`🔄 Clearing ${name}...`);
      execSync(command, { stdio: 'ignore' });
      console.log(`   ✅ ${name} cleared`);
    }
  } catch (error) {
    if (!optional) {
      console.log(`   ⚠️  Failed to clear ${name}: ${error.message}`);
    }
  }
}

console.log('\n📦 Reinstalling dependencies...\n');
console.log('   This might take a few minutes...');

try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('\n✅ Dependencies reinstalled');
} catch (error) {
  console.error('❌ Failed to reinstall dependencies:', error.message);
}

console.log('\n✨ Troubleshooting complete!\n');
console.log('Next steps:');
console.log('1. Make sure your .env file has the correct Firebase configuration');
console.log('2. Run: npx expo start -c');
console.log('3. If on iOS, you may need to rebuild: npx expo run:ios');
console.log('4. If on Android, you may need to rebuild: npx expo run:android');
console.log('\nIf the issue persists:');
console.log('- Check that the Firebase project is active in Firebase Console');
console.log('- Verify the API key is enabled for your app in Google Cloud Console');
console.log('- Make sure the bundle ID/package name matches Firebase configuration');
