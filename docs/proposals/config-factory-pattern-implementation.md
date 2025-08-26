# Configuration Factory Pattern Implementation Plan

## Overview

We'll convert all service configurations to use factory functions, preventing circular dependencies while keeping all exports in `config/index.ts`.

## Implementation Details

### 1. PostHog Configuration

**Current (Problematic):**
```typescript
// config/posthog/posthog.native.ts
import { config } from '../index';
export const posthog = new PostHog(config.posthog.apiKey, {...});
```

**New (Factory Pattern):**
```typescript
// config/posthog/posthog.native.ts
import PostHog from 'posthog-react-native';

export function createPostHog(apiKey: string, host: string): PostHog {
  return new PostHog(apiKey, {
    host,
    captureApplicationLifecycleEvents: true,
    captureDeepLinks: true,
    captureScreens: true,
    flushAt: 20,
    flushInterval: 30000,
    autocapture: false,
    debug: __DEV__,
  });
}

// config/posthog/posthog.web.ts
import posthog from 'posthog-js';

export function createPostHog(apiKey: string, host: string) {
  // Return configured options for web initialization
  return {
    apiKey,
    config: {
      api_host: host,
      capture_pageview: true,
      capture_pageleave: true,
      cross_subdomain_cookie: true,
      autocapture: false,
      debug: __DEV__,
    }
  };
}
```

### 2. Firebase Configuration

**Current:**
```typescript
// config/firebase/init.ts
import { config } from '../index';
export const app = initializeApp(config.firebase);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

**New:**
```typescript
// config/firebase/init.ts
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { FirebaseOptions } from 'firebase/app';

interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

export function createFirebaseServices(config: FirebaseOptions): FirebaseServices {
  const app = initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);
  
  return { app, auth, db };
}
```

### 3. Stripe Configuration

**Current (with direct env access):**
```typescript
// config/stripe/config.ts
function validateEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const stripeConfig = {
  publishableKey: validateEnv('EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
  merchantId: validateEnv('EXPO_PUBLIC_STRIPE_MERCHANT_ID'),
  testMode: __DEV__,
};
```

**New:**
```typescript
// config/stripe/config.ts
export interface StripeConfigOptions {
  publishableKey: string;
  merchantId: string;
  isDevelopment: boolean;
}

export function createStripeConfig(options: StripeConfigOptions) {
  return {
    publishableKey: options.publishableKey,
    merchantId: options.merchantId,
    testMode: options.isDevelopment,
    // Any other Stripe configuration
  };
}

// config/stripe/provider.native.tsx will also need updates
export function createStripeProvider(publishableKey: string, merchantId: string) {
  return {
    publishableKey,
    merchantIdentifier: merchantId,
    // Other provider config
  };
}
```

### 4. Main Config File

**Updated config/index.ts:**
```typescript
// config/index.ts

// ============================================
// Environment Configuration (no imports from submodules yet!)
// ============================================
function validateEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// Define config first
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

// ============================================
// Now import and initialize services using factories
// ============================================
import { createFirebaseServices } from './firebase/init';
import { createPostHog } from './posthog/posthog';
import { createStripeConfig } from './stripe/config';

// Initialize Firebase
const firebaseServices = createFirebaseServices(config.firebase);
export const { app, auth, db } = firebaseServices;

// Initialize PostHog
export const posthog = createPostHog(config.posthog.apiKey, config.posthog.host);

// Initialize Stripe Config
export const stripeConfig = createStripeConfig({
  publishableKey: config.stripe.publishableKey,
  merchantId: config.stripe.merchantId,
  isDevelopment: config.environment.isDevelopment,
});

// Re-export other items that don't cause circular deps
export { firebaseConfig } from './firebase/config';
export { isWeb, validateFirebaseConfig } from './firebase/index';

// Legacy exports
export const apiConfig = {
  baseUrl: config.api.url,
};

export const APP_CONFIG = {
  version: '1.0.0',
  features: {
    enableNotifications: true,
    enablePayments: true,
  },
  defaults: {
    currency: 'USD',
    language: 'en',
  },
};
```

## Benefits

1. **No Circular Dependencies**: Services don't import from config/index.ts
2. **Single Source of Truth**: Only config/index.ts accesses environment variables
3. **Clean Exports**: Everything still exportable from @/config
4. **Type Safe**: Full TypeScript support
5. **Testable**: Easy to mock factories for testing

## Migration Steps

1. Update PostHog configs to export factory functions
2. Update Firebase init to export factory function
3. Update Stripe configs to use factory pattern and remove env access
4. Update config/index.ts to use all factories
5. No changes needed to imports throughout the app - they stay the same!

## Key Point

The beauty of this approach is that **all existing imports throughout the app remain unchanged**. Files can still do:

```typescript
import { config, auth, posthog, stripeConfig } from '@/config';
```

Everything works exactly as before, but without circular dependencies!