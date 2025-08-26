# Authentication & Authorization Guide

## Overview

This application uses a **dual-layer authentication system** with a **single navigation controller** architecture:
- **Firebase Authentication**: Handles identity, passwords, tokens
- **MongoDB**: Stores user data, preferences, roles
- **Centralized Navigation**: All routing decisions made in one place (`app/_layout.tsx`)

## Architecture

### Navigation Architecture (UPDATED)

```
┌──────────────┐
│  _layout.tsx │ ← Single Navigation Controller
└──────┬───────┘
       │ All routes in tree, guards handle protection
       ▼
   ┌───────────────────────────┐
   │ Not Authenticated?         │ → Redirect to /(auth)
   │ Authenticated + Onboarding?│ → Redirect to /(onboarding)  
   │ Authenticated + Complete?  │ → Redirect to /(tabs)/home
   └───────────────────────────┘
```

### Authentication Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│              │     │              │     │              │
│   Firebase   │────▶│   MongoDB    │────▶│     App      │
│     Auth     │     │    Users     │     │   Features   │
│              │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
     Identity            App Data            Business Logic
```

## Key Principles (IMPORTANT!)

1. **Single Navigation Controller**: ALL navigation decisions are made in `app/_layout.tsx`
2. **No Navigation in Providers**: Providers only manage state, NEVER trigger navigation
3. **Declarative Navigation**: Navigation is based on state, not imperative commands
4. **Single Source of Truth**: User data is fetched ONCE in AuthProvider
5. **Platform Agnostic**: Same logic works on web and mobile

## Authentication Flow

### 1. User Registration

```typescript
// Frontend: /app/providers/auth-provider.tsx
const signUp = async (email: string, password: string, displayName?: string) => {
  // Step 1: Create Firebase user
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Step 2: Set display name in Firebase
  if (displayName) {
    await updateProfile(userCredential.user, { displayName });
  }
  
  // Step 3: onAuthStateChanged fires automatically
  // Step 4: Backend auto-creates MongoDB user on first API call
  // Step 5: User profile fetched with retry logic (3 attempts)
  // Step 6: _layout.tsx detects new user and redirects to onboarding
};
```

### 2. Navigation Control (UPDATED)

```typescript
// app/_layout.tsx - Navigation with all routes in tree
function App() {
  const { isInitialized, user } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  
  // Handle navigation based on auth state
  useEffect(() => {
    if (!isInitialized) return;
    
    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    
    if (!user && !inAuthGroup) {
      // Not authenticated and not in auth screens - redirect to auth
      router.replace('/(auth)');
    } else if (user && !user.onboardingCompleted && !inOnboardingGroup) {
      // Authenticated but not onboarded - redirect to onboarding
      router.replace('/(onboarding)');
    } else if (user && user.onboardingCompleted && (inAuthGroup || inOnboardingGroup)) {
      // Fully authenticated but in auth/onboarding screens - redirect to home
      router.replace('/(tabs)/home');
    }
  }, [isInitialized, user, segments, router]);
  
  // All routes exist in the tree - navigation guards handle protection
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}
```

### 3. Custom Claims

Firebase custom claims link Firebase UID to MongoDB ID:

```typescript
// Backend: /server/services/user/set-user-custom-claims.ts
await admin.auth().setCustomUserClaims(firebaseUid, {
  mongoId: mongoUser._id.toString()
});
```

**Why Custom Claims?**
- Included in every Firebase token
- No extra database lookup for MongoDB ID
- Secure and verified by Firebase
- Available in TRPC context

### 4. Token Validation

```typescript
// Backend: /server/trpc/context.ts
export async function createContext({ req }: CreateExpressContextOptions) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return { user: null };
  }
  
  try {
    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Get MongoDB user using custom claim or auto-create
    let user = await findUserByMongoId(decodedToken.mongoId);
    
    if (!user && decodedToken) {
      // Auto-create user if doesn't exist
      user = await createUserInDb({
        uid: decodedToken.uid,
        email: decodedToken.email!,
        displayName: decodedToken.name || '',
      });
    }
    
    return { user };
  } catch (error) {
    return { user: null };
  }
}
```

## Platform-Specific Implementation

### Firebase Configuration

Firebase is configured per platform for optimal performance:

- **Web**: `config/firebase.web.ts` - Uses browser persistence
- **Native**: `config/firebase.native.ts` - Uses AsyncStorage persistence

The main `firebase.ts` file acts as a router, and Metro bundler automatically selects the correct implementation:

```typescript
// config/firebase.ts
export { auth } from './firebase'; // Metro resolves to .web.ts or .native.ts
```

## Authorization Levels

### 1. Public Procedures
No authentication required:

```typescript
const publicProcedure = procedure.use(logRequests);
```

### 2. Protected Procedures
Requires authenticated user:

```typescript
const protectedProcedure = procedure
  .use(logRequests)
  .use(isAuthenticated); // Throws if no user
```

### 3. Admin Procedures
Requires admin role:

```typescript
const adminProcedure = procedure
  .use(logRequests)
  .use(isAuthenticated)
  .use(isAdmin); // Throws if not admin
```

## Session Management

### AuthProvider State Management (UPDATED)

```typescript
// providers/auth/index.tsx
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
    setLoading(true);
    
    try {
      if (authUser) {
        // Get token
        const authToken = await authUser.getIdToken();
        setToken(authToken);

        // Fetch user profile with retry logic
        let retries = 3;
        let userProfile = null;
        
        while (retries > 0 && !userProfile) {
          try {
            userProfile = await trpcClient.user.get.query();
          } catch (fetchError: any) {
            retries--;
            if (retries === 0) {
              console.error('[AuthProvider] Failed to fetch user profile after retries:', fetchError?.message);
              throw fetchError;
            }
            // Wait a bit before retrying (backend might be creating user)
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        if (userProfile) {
          setUser(userProfile);
          setError(null);
        }
      } else {
        // No Firebase user - clear everything
        setUser(null);
        setToken(null);
        setError(null);
      }
    } catch (error: any) {
      // Only clear state if it's not a temporary network error
      if (error?.message?.includes('User not found') || error?.code === 'UNAUTHORIZED') {
        setUser(null);
        setToken(null);
      }
      setError(error as Error);
    } finally {
      setIsInitialized(true);
      setLoading(false);
    }
  });
  
  return unsubscribe;
}, []);
```

### Sign Out (UPDATED)

```typescript
const signOut = async () => {
  // Clear cache and sign out
  queryClient.clear();
  await firebaseSignOut(auth);
  
  // Clear state
  setUser(null);
  setToken(null);
  
  // Navigation happens automatically via _layout.tsx
};
```

## Security Best Practices

### Protected Routes (NEW APPROACH)

Routes are protected at the **layout level**, not in individual screens:

```typescript
// GOOD: Protection in _layout.tsx
if (!user) {
  return <AuthStackOnly />; // App stack never rendered
}

// BAD: Protection in individual screens
function ProfileScreen() {
  const { user } = useAuth();
  if (!user) {
    router.push('/login'); // Can be bypassed
  }
}
```

### Token Handling
- ✅ Store tokens in memory, not localStorage
- ✅ Include in Authorization header
- ✅ Refresh before expiry
- ✅ Clear on logout

### Role Verification
- ✅ Check roles on backend, never trust frontend
- ✅ Use middleware for consistent checks
- ✅ Fail closed (deny by default)

## Common Patterns

### DO ✅

```typescript
// Let _layout.tsx handle navigation
await signUp(email, password);
// That's it! Navigation happens automatically

// Refresh user after updates
await updateUserMutation.mutateAsync(data);
await refreshUser();

// Simple conditional rendering
{user.isAdmin && <AdminPanel />}
```

### DON'T ❌

```typescript
// Don't navigate in providers
await signUp(email, password);
router.push('/onboarding'); // WRONG!

// Don't add guards in screens
if (!user) {
  router.push('/login'); // WRONG!
}

// Don't fetch user multiple times
const { data: userData } = trpc.user.get.useQuery(); // Already in AuthProvider!
```

## Onboarding Integration

### Onboarding Flow (UPDATED)

1. User completes auth → `_layout.tsx` shows onboarding
2. User completes step → Backend updates, frontend refreshes
3. State changes → `_layout.tsx` reacts
4. Process repeats until `onboardingCompleted: true`
5. `_layout.tsx` shows main app

### OnboardingProvider (SIMPLIFIED)

```typescript
export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user, refreshUser } = useAuth();
  
  // Get onboarding state from user (no duplicate fetch!)
  const onboardingCompleted = user?.onboardingCompleted ?? false;
  const currentStep = user?.onboarding?.currentStep ?? 0;
  
  const completeStep = async () => {
    await completeStepMutation.mutateAsync({ action: 'complete' });
    await refreshUser(); // Single source of truth
  };
  
  // ...
}
```

## Debugging Auth Issues

### Check Navigation Flow

```typescript
// Add logging to _layout.tsx
console.log('Auth Check:', {
  isInitialized,
  hasUser: !!user,
  isAuthenticated: user && user.uid && user.email && user._id,
  onboardingCompleted: user?.onboardingCompleted
});
```

### Common Issues

**Issue**: Infinite navigation loops
- **Cause**: Multiple components trying to navigate
- **Fix**: Only `_layout.tsx` should make navigation decisions

**Issue**: User stuck on loading screen
- **Check**: `isInitialized` is set to true in AuthProvider
- **Check**: Firebase is properly configured
- **Check**: Both `isInitialized` and `minLoadTimeElapsed` are true (1.5s minimum)

**Issue**: Can access app without auth
- **Check**: `_layout.tsx` properly checks authentication
- **Check**: Navigation guards are checking segments correctly

**Issue**: Onboarding navigation not working
- **Check**: User data includes onboarding fields
- **Check**: `refreshUser()` called after completing steps

**Issue**: "Property 'apiConfig' doesn't exist"
- **Cause**: Missing import in auth provider
- **Fix**: Import both `auth` and `apiConfig` from `@/config`

**Issue**: Signup creates Firebase user but no backend calls
- **Cause**: Missing `apiConfig` import preventing TRPC client setup
- **Fix**: Ensure auth provider imports: `import { auth, apiConfig } from '@/config';`

**Issue**: User profile fetch fails
- **Check**: Backend server is running
- **Check**: EXPO_PUBLIC_API_URL is correct in .env
- **Check**: Retry logic gives backend time to auto-create user (3 attempts with 1s delay)

## Testing Authentication

### Manual Testing Checklist

1. **Sign Up Flow**
   - [ ] Can create account
   - [ ] Redirected to onboarding
   - [ ] Cannot access app pages
   - [ ] Cannot go back to auth

2. **Sign In Flow**  
   - [ ] Can login with credentials
   - [ ] Redirected based on onboarding status
   - [ ] Token persists on refresh

3. **Protected Routes**
   - [ ] Cannot access app without auth
   - [ ] Cannot skip onboarding
   - [ ] Admin routes require admin role

4. **Sign Out Flow**
   - [ ] Clears all state
   - [ ] Redirected to auth
   - [ ] Cannot access protected routes

## Migration Notes

### From Old Architecture

If migrating from navigation-in-providers pattern:

1. Remove all `router.push()` calls from providers
2. Remove navigation logic from auth screens
3. Centralize all navigation in `_layout.tsx`
4. Remove duplicate user fetching
5. Test all flows thoroughly

### Key Changes

- **Before**: Navigation scattered across providers and screens
- **After**: Single navigation controller in `_layout.tsx`

- **Before**: User data fetched multiple times
- **After**: Single fetch in AuthProvider

- **Before**: Complex navigation effects with dependencies
- **After**: Simple state-based navigation