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
  stripe: {
    publishableKey: string;
    merchantId: string;
  };
  posthog: {
    apiKey: string;
    host: string;
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
  stripe: {
    publishableKey: validateEnv('EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
    merchantId: validateEnv('EXPO_PUBLIC_STRIPE_MERCHANT_ID'),
  },
  posthog: {
    apiKey: validateEnv('EXPO_PUBLIC_POSTHOG_API_KEY'),
    host: validateEnv('EXPO_PUBLIC_POSTHOG_HOST', 'https://app.posthog.com'),
  },
  environment: {
    isDevelopment: __DEV__,
    isProduction: !__DEV__,
    isTest: process.env.NODE_ENV === 'test',
  },
};

// Legacy API configuration for backward compatibility
export const apiConfig = {
  baseUrl: config.api.url,
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

// Stripe exports
export {
  validateStripeConfig,
  type StripeConfig
} from './stripe';

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
import { createStripeConfig, createPaymentSheetConfig } from './stripe';

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

// Initialize Stripe configuration
export const stripeConfig = createStripeConfig({
  publishableKey: config.stripe.publishableKey,
  merchantId: config.stripe.merchantId,
  isDevelopment: config.environment.isDevelopment,
});

export const paymentSheetConfig = createPaymentSheetConfig(
  stripeConfig,
  config.environment.isDevelopment
);

// Platform-specific Stripe promise for web
let stripePromise: Promise<any> | undefined;
if (typeof window !== 'undefined') {
  // Dynamically import for web platform only
  import('./stripe/stripe.web').then(({ createStripePromise }) => {
    stripePromise = createStripePromise(config.stripe.publishableKey);
  });
}
export { stripePromise };

