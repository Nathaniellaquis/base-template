# Configuration Circular Dependency Fix Options

## Problem Statement

We have a circular dependency issue in our configuration structure:

```
config/index.ts → firebase/index.ts → firebase/config.ts → config/index.ts
config/index.ts → posthog/posthog.ts → posthog/posthog.native.ts → config/index.ts
```

This causes "Cannot read property 'firebase/posthog' of undefined" errors because:
1. `config/index.ts` starts loading
2. It encounters re-exports from sub-modules (lines 90-100)
3. Sub-modules start loading and import `config` from `../index`
4. But `config/index.ts` hasn't finished loading yet, so `config` is `undefined`

## Option 1: Extract Environment Configuration (Recommended)

Create a separate `env.ts` file that all modules can import from:

**Pros:**
- Single source of truth for environment variables
- Clean dependency flow: `env.ts` → sub-modules → `index.ts`
- Type-safe with full IntelliSense support
- Follows industry best practices
- No code duplication

**Cons:**
- Adds one more file to the config structure
- Requires updating imports in sub-modules

**Implementation:**
```typescript
// config/env.ts
export const env = {
  firebase: {
    apiKey: validateEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
    // ... other firebase config
  },
  posthog: {
    apiKey: validateEnv('EXPO_PUBLIC_POSTHOG_API_KEY'),
    host: validateEnv('EXPO_PUBLIC_POSTHOG_HOST'),
  },
  // ... other config
};

// config/firebase/config.ts
import { env } from '../env';
export const firebaseConfig: FirebaseOptions = env.firebase;

// config/index.ts
import { env } from './env';
export const config: AppConfig = {
  firebase: env.firebase,
  posthog: env.posthog,
  // ... rest of config
};
```

## Option 2: Self-Contained Sub-Modules (Like Stripe)

Make each sub-module read environment variables directly:

**Pros:**
- Each module is completely independent
- No circular dependencies possible
- Simple to understand

**Cons:**
- Duplicates `validateEnv` function across modules
- No single source of truth for env vars
- Harder to maintain if env var names change

**Implementation:**
```typescript
// config/firebase/config.ts
function validateEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const firebaseConfig: FirebaseOptions = {
  apiKey: validateEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: validateEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  // ... rest of config
};
```

## Option 3: Lazy Initialization

Initialize services lazily to avoid module load-time issues:

**Pros:**
- Minimal changes to existing code
- Works around the circular dependency

**Cons:**
- Doesn't fix the root cause
- Can lead to runtime errors if not careful
- Less predictable initialization order

**Implementation:**
```typescript
// config/posthog/posthog.native.ts
let posthogInstance: PostHog | null = null;

export const getPostHog = (): PostHog => {
  if (!posthogInstance) {
    const { config } = require('../index');
    posthogInstance = new PostHog(config.posthog.apiKey, {
      host: config.posthog.host,
      // ... options
    });
  }
  return posthogInstance;
};
```

## Option 4: Don't Re-export from Index

Remove re-exports from `config/index.ts`:

**Pros:**
- Simplest solution
- No circular dependencies

**Cons:**
- Less convenient imports (need to import from specific files)
- Breaking change for existing code

**Implementation:**
```typescript
// config/index.ts
// Remove these lines:
// export { app, auth, db, firebaseConfig } from './firebase/index';
// export { posthog } from './posthog/posthog';

// Users would import directly:
import { firebaseConfig } from '@/config/firebase/config';
import { posthog } from '@/config/posthog/posthog';
```

## Option 5: Use Barrel Exports Pattern

Create separate barrel files for different concerns:

**Pros:**
- Clear separation of concerns
- No circular dependencies
- Flexible import options

**Cons:**
- More files to manage
- Need to be careful about import paths

**Implementation:**
```typescript
// config/services.ts - Re-exports service instances
export { app, auth, db } from './firebase/index';
export { posthog } from './posthog/posthog';

// config/settings.ts - Re-exports configuration values
export { firebaseConfig } from './firebase/config';
export { stripeConfig } from './stripe/config';

// config/index.ts - Only exports the main config object
export const config: AppConfig = {
  // ... environment config
};
```

## Recommendation

**Option 1 (Extract Environment Configuration)** is the best solution because:

1. It solves the root cause, not just the symptoms
2. Maintains a single source of truth
3. Provides the cleanest architecture
4. Is a common pattern in production applications
5. Makes testing easier (can mock `env.ts`)

The implementation is straightforward and provides long-term maintainability benefits.