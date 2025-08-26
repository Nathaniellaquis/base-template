# Configuration Circular Dependency Fix - Final Proposal

## Problem Statement

We have a circular dependency issue in our configuration structure:

```
config/index.ts → firebase/index.ts → firebase/config.ts → config/index.ts
config/index.ts → posthog/posthog.ts → posthog/posthog.native.ts → config/index.ts
```

This causes "Cannot read property 'firebase/posthog' of undefined" errors.

## Proposed Solution: Remove Re-exports from Config Index

### Core Principle
- **Only `config/index.ts` should access environment variables directly**
- All other files should import configuration from `config/index.ts`
- No re-exports of service instances from `config/index.ts`

### Implementation Plan

#### 1. Update `config/index.ts`
Remove all re-exports of service instances:

```typescript
// config/index.ts

// REMOVE THESE LINES:
// export { app, auth, db, firebaseConfig } from './firebase/index';
// export { posthog } from './posthog/posthog';
// export * from './stripe';

// KEEP ONLY:
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

// Export other constants that don't cause circular deps
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

#### 2. Update Import Statements Throughout the App

Change all imports from:
```typescript
import { auth, posthog, firebaseConfig } from '@/config';
```

To:
```typescript
import { config } from '@/config';
import { auth } from '@/config/firebase';
import { posthog } from '@/config/posthog/posthog';
```

#### 3. Fix Stripe Configuration

The Stripe config files currently access environment variables directly. We need to update them to use `config` instead:

```typescript
// config/stripe/config.ts
import { config } from '../index';

export const stripeConfig = {
  publishableKey: config.stripe.publishableKey,
  merchantId: config.stripe.merchantId,
  testMode: config.environment.isDevelopment,
};
```

### Benefits

1. **No Circular Dependencies**: Sub-modules don't import from the parent that's trying to import them
2. **Single Source of Truth**: Only `config/index.ts` accesses environment variables
3. **Type Safety**: Full TypeScript support and IntelliSense
4. **Clear Import Paths**: More explicit about what you're importing
5. **Better Tree Shaking**: Bundlers can optimize better when imports are specific

### Migration Steps

1. **Update `config/index.ts`** - Remove all re-exports
2. **Fix Stripe files** - Update to import from config instead of accessing env directly
3. **Update all imports** - Use direct imports instead of barrel exports
4. **Test thoroughly** - Ensure all config values are accessible

### Files That Need Updates

Based on current usage, these files will need import updates:
- All files importing `auth`, `db`, `app` from `@/config`
- All files importing `posthog` from `@/config`
- All files importing `firebaseConfig` from `@/config`
- Stripe config files that use `validateEnv` directly

### Example After Fix

```typescript
// Before
import { config, auth, posthog } from '@/config';

// After
import { config } from '@/config';
import { auth } from '@/config/firebase';
import { posthog } from '@/config/posthog/posthog';
```

This approach maintains clean architecture while solving the circular dependency issue permanently.