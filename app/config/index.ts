/**
 * Centralized app configuration
 * All environment variables and app config should be accessed through this file
 */

// ============================================
// Environment Configuration Types
// ============================================
export interface AppConfig {
  api: {
    url: string;
  };
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  posthog: {
    apiKey: string;
    host: string;
  };
  revenuecat: {
    iosKey: string;
    androidKey: string;
    webKey: string;
  };
  environment: {
    isDevelopment: boolean;
    isProduction: boolean;
    isTest: boolean;
  };
}

// ============================================
// Environment Variable Validation
// ============================================
function validateEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}. Please add it to your .env file.`);
  }

  return value;
}


// ============================================
// Main Configuration Object
// ============================================
export const config: AppConfig = {
  api: {
    url: validateEnv('EXPO_PUBLIC_API_URL', 'http://localhost:3000'),
  },
  firebase: {
    apiKey: validateEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
    authDomain: validateEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: validateEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
    storageBucket: validateEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: validateEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    appId: validateEnv('EXPO_PUBLIC_FIREBASE_APP_ID'),
  },
  posthog: {
    apiKey: process.env.EXPO_PUBLIC_POSTHOG_API_KEY || '',
    host: process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
  },
  revenuecat: {
    iosKey: validateEnv('EXPO_PUBLIC_REVENUECAT_IOS_KEY', ''),
    androidKey: validateEnv('EXPO_PUBLIC_REVENUECAT_ANDROID_KEY', ''),
    webKey: validateEnv('EXPO_PUBLIC_REVENUECAT_WEB_KEY', ''),
  },
  environment: {
    isDevelopment: __DEV__,
    isProduction: !__DEV__,
    isTest: process.env.NODE_ENV === 'test',
  },
};


// ============================================
// Re-export remaining items from submodules
// ============================================

// Firebase exports
export {
  isWeb,
  validateFirebaseConfig,
  type FirebaseOptions,
  type User,
  type UserCredential
} from './firebase';

// RevenueCat exports
export {
  entitlementToPlan, getHighestEntitlement,
  getPackageIdentifier,
  // Helper Functions
  getRevenueCatApiKey, PLAN_FEATURES, planToEntitlement, PRODUCT_IDS,
  // Configuration & Constants
  REVENUECAT_CONFIG, TRIAL_CONFIG,
  // Validation
  validateRevenueCatConfig,
  // Types
  type PurchaseResult,
  type SubscriptionInfo
} from './revenuecat';

// ============================================
// App-specific configuration (not from environment)
// ============================================
export const APP_CONFIG = {
  // App version
  version: '1.0.0',

  // Feature flags
  features: {
    enableNotifications: true,
    enablePayments: true,
    enableWorkspaces: true, // Hardcoded - change this to enable/disable workspaces
  },

  // Other app-wide configuration
  defaults: {
    currency: 'USD',
    language: 'en',
  },
};

// ============================================
// Import factory functions from submodules
// ============================================
import { createFirebaseServices } from './firebase';
import { createPostHog } from './posthog/posthog';

// ============================================
// Initialize services using factory functions
// ============================================

// Initialize Firebase services
const firebaseServices = createFirebaseServices(config.firebase);
export const { app, auth, db } = firebaseServices;

// Export firebase config for components that need it directly
export const firebaseConfig = config.firebase;

// Initialize PostHog
export const posthog = createPostHog(config.posthog.apiKey, config.posthog.host);

