# Navigation Debugging Guide

## Issue
After successful signup, the app stays on the signup page instead of navigating to onboarding.

## Expected Flow
1. User signs up → Firebase user created
2. Backend user created with `onboardingCompleted: false`
3. Auth state changes, user profile is fetched
4. User should be redirected to `/(onboarding)`

## Debugging Steps Added

### 1. Auth Provider (`/providers/auth/index.tsx`)
- Added logging to `completeInitialization` to track when auth state is finalized
- Added logging when user profile is successfully fetched
- Added logging for minimum load time elapsed

### 2. Main Layout (`/app/_layout.tsx`)
- Added comprehensive logging for navigation decisions
- Logs current segments, user state, and navigation actions

### 3. Auth Layout (`/app/(auth)/_layout.tsx`)
- Added check for `isInitialized` before making navigation decisions
- Added logging for auth state and navigation redirects
- Returns `null` until initialization is complete to prevent premature navigation

### 4. Onboarding Layout (`/app/(onboarding)/_layout.tsx`)
- Added similar initialization check
- Added logging for navigation decisions

### 5. Signup Screen (`/app/(auth)/signup/index.tsx`)
- Added logging for signup process start and completion

## How to Debug

1. Open the browser console (or React Native debugger)
2. Clear the console
3. Try to sign up with a new account
4. Look for the following log sequence:

```
[Signup] Starting signup process for: user@example.com
[AuthProvider] Backend user created successfully
[Signup] Signup completed successfully
[AuthProvider] User profile fetched successfully: {user object}
[AuthProvider] Completing initialization with: {hasUser: true, ...}
[AuthProvider] Minimum load time elapsed
[App Layout] Navigation check: {isInitialized: true, hasUser: true, onboardingCompleted: false, ...}
[App Layout] Redirecting to onboarding
[Auth Layout] User authenticated but not onboarded - redirecting to onboarding
```

## Potential Issues to Check

1. **Race Condition**: Multiple layouts trying to navigate simultaneously
2. **Timing Issue**: `isInitialized` not being set to `true` due to `minLoadTimeElapsed`
3. **User Object**: Check if `onboardingCompleted` is properly set to `false`
4. **Navigation Guard Conflicts**: Both `_layout.tsx` files trying to navigate

## Next Steps

After reviewing the console logs:
1. Identify where the navigation flow stops
2. Check if all expected logs appear
3. Look for any errors or unexpected values
4. Focus on the specific component that's not behaving as expected