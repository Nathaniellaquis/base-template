# Authentication Flow Architecture

## Overview

The app uses a **single source of truth** pattern for authentication, where all auth logic is centralized in the root `_layout.tsx`. This approach is clean, simple, and works identically on both web and mobile platforms.

## How It Works

### 1. Provider Hierarchy
```
RootLayout
  └── Providers (Theme, TRPC, Auth, Analytics, etc.)
      └── App Component (performs auth checks)
          └── Conditional Stack rendering based on auth state
```

### 2. Auth State Logic

The root `App` component in `_layout.tsx` uses simple conditional rendering:

```typescript
// Check 1: Is user authenticated?
if (!isAuthenticated) {
  return <Stack><Stack.Screen name="(auth)" /></Stack>
}

// Check 2: Has user completed onboarding?
if (!user.onboardingCompleted) {
  return <Stack><Stack.Screen name="(onboarding)" /></Stack>
}

// User is fully authenticated and onboarded
return <Stack>
  <Stack.Screen name="(tabs)" />
  <Stack.Screen name="(admin)" />
</Stack>
```

### 3. Automatic Navigation

- **No explicit redirects needed** - React's re-render cycle handles navigation
- When auth state changes, the root component re-renders and shows the appropriate screens
- This works identically on web (URL changes) and mobile (stack navigation)

### 4. Protected Routes

All routes are automatically protected because:
- Unauthenticated users can only see `(auth)` screens
- Non-onboarded users can only see `(onboarding)` screens
- Only fully authenticated users can access `(tabs)` and `(admin)`

### 5. Deep Links

Deep links are automatically handled:
- Web: Direct URL navigation goes through the root auth check
- Mobile: Deep links are processed after the auth state is verified
- No additional protection needed

## Key Benefits

1. **DRY Code** - Auth logic in one place only
2. **No Provider Errors** - Nested layouts don't need `useAuth()`
3. **Automatic Protection** - All routes protected by default
4. **Platform Agnostic** - Same logic for web and mobile
5. **Simple & Clear** - Easy to understand and maintain

## Best Practices

1. **Don't use `useAuth()` in layout files** - Only in screens/components
2. **Keep auth logic in root layout only** - Single source of truth
3. **Let React handle navigation** - No manual redirects needed
4. **Trust the conditional rendering** - It prevents unauthorized access

## Common Pitfalls to Avoid

❌ Don't add auth checks in nested layouts
❌ Don't manually redirect after login/logout
❌ Don't worry about deep link protection (it's automatic)
❌ Don't duplicate auth logic

✅ Do keep it simple and centralized
✅ Do trust the root layout's logic
✅ Do use `useAuth()` in screens for user data
✅ Do let React's re-render handle navigation