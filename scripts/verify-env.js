#!/usr/bin/env node
/**
 * Script to verify environment variables are loaded correctly
 * This helps diagnose Firebase API key and other env-related issues
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

console.log('🔍 Verifying Environment Variables\n');
console.log('=' .repeat(50));

// Check Node environment
console.log('\n📦 Node Environment:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`   Node Version: ${process.version}`);

// Check Firebase Frontend Config
console.log('\n🔥 Firebase Frontend Configuration:');
const firebaseFrontendVars = {
  'API Key': 'EXPO_PUBLIC_FIREBASE_API_KEY',
  'Auth Domain': 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'Project ID': 'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'Storage Bucket': 'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'Messaging Sender ID': 'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'App ID': 'EXPO_PUBLIC_FIREBASE_APP_ID'
};

let hasErrors = false;

for (const [label, varName] of Object.entries(firebaseFrontendVars)) {
  const value = process.env[varName];
  if (!value) {
    console.error(`   ❌ ${label}: NOT SET (${varName})`);
    hasErrors = true;
  } else if (value.includes('your-') || value.includes('example')) {
    console.warn(`   ⚠️  ${label}: PLACEHOLDER VALUE - "${value.substring(0, 30)}..."`);
    hasErrors = true;
  } else {
    // Mask the value for security
    const masked = value.length > 10 
      ? value.substring(0, 6) + '...' + value.substring(value.length - 4)
      : '***';
    console.log(`   ✅ ${label}: ${masked}`);
  }
}

// Check Firebase Backend Config
console.log('\n🔐 Firebase Backend Configuration:');
const firebaseBackendVars = {
  'Admin Private Key': 'FIREBASE_ADMIN_PRIVATE_KEY',
  'Admin Client Email': 'FIREBASE_ADMIN_CLIENT_EMAIL',
  'Admin Project ID': 'FIREBASE_ADMIN_PROJECT_ID'
};

for (const [label, varName] of Object.entries(firebaseBackendVars)) {
  const value = process.env[varName];
  if (!value) {
    console.error(`   ❌ ${label}: NOT SET (${varName})`);
    hasErrors = true;
  } else {
    const masked = varName.includes('KEY') 
      ? '***PRIVATE KEY***'
      : value.substring(0, 10) + '...';
    console.log(`   ✅ ${label}: ${masked}`);
  }
}

// Check Other Important Variables
console.log('\n🌐 API Configuration:');
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
if (!apiUrl) {
  console.error('   ❌ API URL: NOT SET');
  hasErrors = true;
} else {
  console.log(`   ✅ API URL: ${apiUrl}`);
}

// Check PostHog
console.log('\n📊 Analytics Configuration:');
const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST;

if (!posthogKey) {
  console.warn('   ⚠️  PostHog API Key: NOT SET (analytics disabled)');
} else {
  const masked = posthogKey.substring(0, 10) + '...';
  console.log(`   ✅ PostHog API Key: ${masked}`);
}

if (!posthogHost) {
  console.warn('   ⚠️  PostHog Host: NOT SET (using default)');
} else {
  console.log(`   ✅ PostHog Host: ${posthogHost}`);
}

// Summary
console.log('\n' + '=' .repeat(50));
if (hasErrors) {
  console.error('\n❌ Environment configuration has errors!');
  console.log('\nTo fix:');
  console.log('1. Check your .env file has all required variables');
  console.log('2. Make sure there are no typos in variable names');
  console.log('3. Replace placeholder values with actual values from Firebase Console');
  console.log('4. Restart your development server after fixing');
  process.exit(1);
} else {
  console.log('\n✅ Environment configuration looks good!');
  console.log('\nIf you\'re still having issues:');
  console.log('1. Run: npm run fix-env (or node scripts/fix-env-loading.js)');
  console.log('2. Clear all caches and restart the dev server');
  console.log('3. Check Firebase Console that your project is active');
}
