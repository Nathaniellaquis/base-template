# Directory Structure Guide

## Overview

This document outlines the directory structure and organization patterns for the application codebase.

## Directory Organization

### `/lib/` - External Services & Business Logic

The `/lib/` directory contains **external service integrations, APIs, SDKs, and feature-specific business logic**.

```
lib/
├── api.ts                    # tRPC client configuration
├── auth/                     # Authentication utilities
│   ├── index.ts             # Auth exports
│   └── clear-auth.ts        # Firebase auth management
├── notifications/            # Notification services
│   ├── index.ts             # Notification exports
│   └── toast.ts             # Toast notification wrapper
├── stripe/                   # Payment processing
│   ├── stripe.ts            # Main Stripe entry
│   ├── stripe.native.ts     # Native Stripe SDK
│   └── stripe.web.ts        # Web Stripe SDK
├── analytics/                # Analytics & tracking
│   ├── index.ts             # Analytics exports
│   ├── events.ts            # Event definitions
│   ├── tracking.ts          # Tracking implementation
│   └── paywall-tracking.ts  # Paywall-specific tracking
└── experiments/              # A/B testing & feature flags
    ├── index.ts             # Experiment utilities
    └── rollout.ts           # Progressive rollout logic
```

**Characteristics:**
- External SDK integrations (Stripe, Firebase, PostHog)
- API client configurations
- Stateful logic and React hooks
- Platform-specific implementations (.web.ts, .native.ts)
- Business domain logic
- Side effects and async operations

### `/utils/` - Pure Utility Functions

The `/utils/` directory contains **pure, stateless utility functions and helpers**.

```
utils/
├── firebase-errors.ts        # Error message mapping
├── formatters.ts            # Data formatting functions
│                           # (dates, currency, numbers)
└── validators.ts            # Input validation functions
                            # (email, password, phone)
```

**Characteristics:**
- Pure functions with no side effects
- No external dependencies (or minimal)
- Stateless transformations
- Reusable across any project
- Simple input → output mappings
- No React hooks or context

## Decision Criteria

### When to use `/lib/`

Place code in `/lib/` when it:
- Integrates with external services or APIs
- Uses React hooks or context
- Has side effects (network calls, storage access)
- Is specific to this application's business logic
- Requires platform-specific implementations
- Manages state or async operations

**Examples:**
```typescript
// ✅ Goes in /lib/auth/
export async function signInWithFirebase(email: string, password: string) {
  return await firebase.auth().signInWithEmailAndPassword(email, password);
}

// ✅ Goes in /lib/analytics/
export function trackPaywallView(step: number) {
  posthog.capture('paywall_viewed', { step });
}

// ✅ Goes in /lib/notifications/
export function showToast(message: string) {
  Toast.show({ text: message }); // External library
}
```

### When to use `/utils/`

Place code in `/utils/` when it:
- Is a pure function with no side effects
- Could be reused in any project
- Performs simple data transformations
- Has no external dependencies (or very minimal)
- Doesn't interact with APIs or services
- Is stateless and deterministic

**Examples:**
```typescript
// ✅ Goes in /utils/formatters.ts
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

// ✅ Goes in /utils/validators.ts
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ✅ Goes in /utils/firebase-errors.ts
export function getErrorMessage(code: string): string {
  const errorMessages = {
    'auth/user-not-found': 'No user found with this email',
    'auth/wrong-password': 'Incorrect password'
  };
  return errorMessages[code] || 'An error occurred';
}
```

## Path Aliases

The application uses TypeScript path aliases for cleaner imports:

- `@/lib/*` → Maps to `/app/lib/*`
- `@/app-utils/*` → Maps to `/app/utils/*`
- `@/components/*` → Maps to `/app/components/*`
- `@/providers/*` → Maps to `/app/providers/*`
- `@/hooks/*` → Maps to `/app/hooks/*`

Note: `@/utils/*` maps to server utils (`/server/utils/*`), so app utils use `@/app-utils/*`.

## Migration History

### Recent Reorganization (August 2024)

To maintain consistency, the following files were moved:

1. **`clear-auth.ts`**: `utils/` → `lib/auth/`
   - Reason: Firebase Auth integration, not a pure function

2. **`toast.ts`**: `utils/` → `lib/notifications/`
   - Reason: External library wrapper, not a pure utility

This ensures uniform organization where:
- External integrations stay in `/lib/`
- Pure utilities stay in `/utils/`

## Best Practices

1. **When in doubt, ask:** "Could this function work in any project without modification?"
   - Yes → `/utils/`
   - No → `/lib/`

2. **Keep related code together:** Group by feature in `/lib/` (auth, payments, analytics)

3. **Platform-specific code:** Use `.web.ts` and `.native.ts` extensions in `/lib/`

4. **Export through index files:** Each subdirectory in `/lib/` should have an `index.ts`

5. **Maintain purity in utils:** Never add side effects to `/utils/` functions

## Examples of Correct Placement

| File/Function | Directory | Reason |
|--------------|-----------|---------|
| Email validator | `/utils/` | Pure function, no dependencies |
| Date formatter | `/utils/` | Simple transformation |
| Firebase auth wrapper | `/lib/auth/` | External service integration |
| Stripe payment handler | `/lib/stripe/` | External SDK |
| PostHog tracking | `/lib/analytics/` | External service, side effects |
| Toast notifications | `/lib/notifications/` | External library wrapper |
| String capitalizer | `/utils/` | Pure transformation |
| API client setup | `/lib/api/` | External service configuration |
| Error message mapping | `/utils/` | Pure object lookup |
| Feature flag check | `/lib/experiments/` | External service, async |