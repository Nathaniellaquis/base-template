# Configuration Circular Dependency Fix - Reverse Approach

## Problem Statement

Same circular dependency issue, but we want to solve it differently.

## Proposed Solution: Prevent Sub-modules from Importing Parent

### Core Principle
- **Keep all exports in `config/index.ts`** for convenience
- **Sub-modules should NOT import from `config/index.ts`**
- **Sub-modules get their config values passed in or use env directly**

### The Issue

Currently:
```typescript
// config/index.ts
export const config = { /* ... */ };
export { posthog } from './posthog/posthog';  // This triggers the circular dep

// config/posthog/posthog.native.ts
import { config } from '../index';  // This creates the circle!
export const posthog = new PostHog(config.posthog.apiKey);
```

### Solution Options

#### Option A: Pass Config During Initialization

```typescript
// config/posthog/posthog.native.ts
import PostHog from 'posthog-react-native';

// Don't initialize here - export a factory function
export function createPostHog(apiKey: string, host: string) {
  return new PostHog(apiKey, {
    host,
    captureApplicationLifecycleEvents: true,
    // ... other options
  });
}

// config/index.ts
import { createPostHog } from './posthog/posthog.native';

export const config = { /* ... */ };

// Initialize services after config is defined
export const posthog = createPostHog(config.posthog.apiKey, config.posthog.host);
export { app, auth, db } from './firebase/index'; // Same pattern for Firebase
```

#### Option B: Sub-modules Access Env Directly (Not Recommended)

```typescript
// config/posthog/posthog.native.ts
import PostHog from 'posthog-react-native';

// Access env directly (violates single source of truth)
const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY || '';
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

export const posthog = new PostHog(POSTHOG_API_KEY, {
  host: POSTHOG_HOST,
  // ... options
});
```

#### Option C: Two-Stage Initialization

```typescript
// config/posthog/posthog.native.ts
import PostHog from 'posthog-react-native';

let posthogInstance: PostHog;

export function initializePostHog(config: { apiKey: string; host: string }) {
  posthogInstance = new PostHog(config.apiKey, {
    host: config.host,
    // ... options
  });
}

export function getPostHog() {
  if (!posthogInstance) {
    throw new Error('PostHog not initialized. Call initializePostHog first.');
  }
  return posthogInstance;
}

// config/index.ts
import { initializePostHog, getPostHog } from './posthog/posthog.native';

export const config = { /* ... */ };

// Initialize after config is ready
initializePostHog(config.posthog);

// Export the getter
export const posthog = getPostHog();
```

## Recommendation

**Option A (Factory Functions)** is the cleanest because:
1. No circular dependencies
2. Config values flow in one direction
3. Services are initialized with proper config
4. Everything can still be exported from `config/index.ts`

However, this approach has drawbacks:
- More complex than just removing re-exports
- Requires refactoring service initialization
- May break existing code that expects services to be pre-initialized

## Alternative: Keep It Simple

The simplest solution might still be to **not re-export services from config/index.ts**. This would mean:

```typescript
// Use this (current problematic way):
import { config, auth, posthog } from '@/config';

// Change to this (simple fix):
import { config } from '@/config';
import { auth } from '@/config/firebase';
import { posthog } from '@/config/posthog/posthog';
```

This is more explicit and prevents any circular dependency issues while keeping the architecture simple.