# Authentication & App Initialization Technical Plan

## Overview
Implement a modern authentication flow with app initialization similar to Tinder, Instagram, and other premium mobile apps. The app will show a loading screen during initialization, check authentication status, fetch user data, and route users appropriately.

## Current State Analysis
- **Auth Provider**: Currently checks Firebase auth state and attempts to fetch MongoDB user data
- **Tab Navigation**: Always visible, includes auth tab (should be hidden when logged in)
- **No Loading Screen**: App immediately shows tabs while auth is still loading
- **No Route Protection**: Unauthenticated users can access protected screens

## Proposed Architecture

### 1. App Initialization Flow
```
App Launch → Splash Screen → Auth Check → User Data Fetch → Route Decision
                    ↓                           ↓
                Loading UI              If auth fails → Auth Screen
                                       If auth success → Main App (Tabs)
```

### 2. Navigation Structure
```
RootLayout
├── SplashScreen (During initialization)
│   └── Shows loading/splash
├── AuthStack (When NOT authenticated - NO TABS/BOTTOM BAR)
│   ├── LoginScreen (full screen)
│   ├── SignupScreen (full screen)
│   └── ForgotPasswordScreen (full screen)
└── AppStack (When authenticated - HAS TABS)
    └── TabNavigator
        ├── HomeTab
        ├── ProfileTab
        └── SettingsTab
```

**Key Point**: Auth screens have NO bottom navigation - they are full screen experiences. Only authenticated users see the tab bar.

## Implementation Plan

### Phase 1: Create Initialization Infrastructure

#### 1.1 Enhanced Auth Provider (Production Approach)
```typescript
// Simple, production-ready state management
interface AuthContextValue {
    // Existing...
    isInitialized: boolean; // Has initial auth check completed?
    user: User | null;      // Combined Firebase + MongoDB user data
    loading: boolean;       // Is any auth operation in progress?
    error: Error | null;    // Any auth errors
    refreshUser: () => Promise<void>; // Force refresh user data
}
```

**Why this approach?**
- No complex state machines needed
- State is derived from simple boolean/null checks
- Similar to how Firebase Auth SDK works internally
- Easy to debug: `if (!isInitialized) show splash`, `if (!user) show auth`

#### 1.2 Initialization Flow (Simple & Scalable)
```typescript
// In AuthProvider
useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            try {
                // Backend identifies user from auth token - no UID needed!
                const profile = await trpcClient.user.get.query();
                setUser(profile);
            } catch (error) {
                // Handle case where Firebase user exists but no MongoDB profile yet
                setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email!,
                    displayName: firebaseUser.displayName,
                    // Basic Firebase data until MongoDB profile is created
                });
            }
        } else {
            setUser(null);
        }
        setIsInitialized(true); // Key: Set this AFTER user check
    });
    return unsubscribe;
}, []);
```

**Key Point**: The backend extracts user info from the Firebase auth token, so we just call `user.get.query()` with no parameters!

### Phase 2: Splash/Loading Screen

#### 2.1 Create SplashScreen Component
- Full screen loading view with app logo
- Progress indicator during data fetch
- Smooth fade transition to next screen
- Handle initialization errors gracefully

#### 2.2 Loading States to Handle
1. **Firebase Auth Check** (100-300ms)
2. **User Profile Fetch** (200-500ms)
3. **Initial App Data** (optional, for preloading common data)

### Phase 3: Navigation Restructure

#### 3.1 Root Layout Changes (Clean Production Pattern)
```typescript
// app/_layout.tsx
export default function RootLayout() {
  const { isInitialized, user } = useAuth();
  
  // Simple, clear logic flow
  if (!isInitialized) {
    return <SplashScreen />;
  }
  
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {user ? (
        // User logged in: Show app with tabs
        <Stack.Screen name="(app)" />
      ) : (
        // User NOT logged in: Show auth screens (NO TABS)
        <Stack.Screen name="(auth)" />
      )}
    </Stack>
  );
}
```

**Key Benefits:**
- Dead simple logic: loading → not authenticated → authenticated
- No tabs/bottom bar for auth screens
- Clean separation of concerns
- Easy to add more conditions later (e.g., onboarding)

#### 3.2 New Route Structure
```
app/
├── (app)/              # Protected routes (requires auth)
│   └── (tabs)/        # Tab navigator
│       ├── index.tsx  # Home
│       ├── profile.tsx
│       └── settings.tsx
├── (auth)/            # Public routes
│   ├── login.tsx
│   ├── signup.tsx
│   └── forgot-password.tsx
├── splash.tsx         # Loading screen
└── _layout.tsx        # Root with auth check
```

### Phase 4: Route Protection

#### 4.1 Protected Route Wrapper
```typescript
// Create a HOC or hook for route protection
export function useProtectedRoute() {
  const { user, isInitialized } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (isInitialized && !user) {
      router.replace('/(auth)/login');
    }
  }, [user, isInitialized]);
  
  return { isAuthorized: !!user };
}
```

#### 4.2 Tab Bar Visibility
- **NO TAB BAR for auth screens** - Login/Signup are full screen
- **TAB BAR only appears after successful authentication**
- Remove auth tab from authenticated view (users use settings to logout)
- Clean navigation between auth and app states

### Phase 5: User Experience Enhancements

#### 5.1 Smooth Transitions
- Fade animations between splash → auth/app
- Slide transitions for auth screens
- Native feel for tab switches

#### 5.2 Error Handling
- Network timeout handling
- Retry mechanisms for failed requests
- Offline mode considerations

#### 5.3 Performance Optimizations
- Preload critical assets during splash
- Cache user profile data
- Minimize time on splash screen

## Implementation Steps

1. **Update Auth Provider**
   - Add initialization tracking
   - Add full profile fetching
   - Handle edge cases (partial data, network errors)

2. **Create Splash Screen**
   - Design loading UI
   - Implement initialization logic
   - Add error states

3. **Restructure Navigation**
   - Create (app) and (auth) route groups
   - Move existing screens to appropriate groups
   - Update imports and navigation

4. **Implement Route Protection**
   - Add auth checks to protected routes
   - Handle deep linking scenarios
   - Test edge cases

5. **Polish User Experience**
   - Add animations
   - Test on various devices
   - Optimize performance

## Success Criteria
- [ ] App shows splash screen on launch
- [ ] Auth state is checked before showing any content
- [ ] User profile is fully loaded before entering app
- [ ] Unauthenticated users cannot access protected routes
- [ ] Tab bar only visible when authenticated
- [ ] Smooth transitions between states
- [ ] Handles errors gracefully
- [ ] Fast initialization (< 2 seconds typical)

## Testing Scenarios
1. First time user (no auth)
2. Returning user (has auth)
3. Expired session
4. Network failures
5. Slow network conditions
6. Deep link handling
7. Background/foreground transitions

## Security Considerations
- Never expose protected content during loading
- Validate auth tokens on each app foreground
- Clear sensitive data on logout
- Handle token refresh seamlessly

## Future Enhancements
- Biometric authentication
- Remember me functionality
- Progressive data loading
- Offline mode support
- Analytics tracking for auth funnel