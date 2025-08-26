# Onboarding System

## Overview

The onboarding system uses a **backend-driven navigation** architecture where:
- **Backend controls flow**: Server determines current step and completion status
- **Frontend reacts to state**: UI updates based on backend state changes
- **Single navigation controller**: All routing decisions made in `app/_layout.tsx`
- **No hardcoded routes**: Steps are dynamically navigated based on configuration

## Architecture

### Backend-Driven Flow

```
┌──────────────┐
│   Backend    │ ← Single source of truth
│ user.onboarding │
└──────┬───────┘
       │ State changes
       ▼
┌──────────────┐
│  _layout.tsx │ ← Reads state and routes
└──────┬───────┘
       │ Shows appropriate screen
       ▼
┌──────────────┐
│ Onboarding   │ ← User completes step
│   Screens    │
└──────┬───────┘
       │ Calls completeStep
       ▼
┌──────────────┐
│   Backend    │ ← Updates state
│   Updates    │
└──────────────┘
```

### Database Schema

#### User Document (MongoDB)
```typescript
interface User {
  // ... existing fields
  onboardingCompleted: boolean; // Default: false
  onboarding?: {
    currentStep: number;
    completedAt?: Date;
    skippedAt?: Date;
    stepData?: Record<string, any>;
  };
}
```

## Key Principles

1. **Backend Controls Navigation**: The server determines which step the user is on
2. **Frontend Follows State**: UI reacts to backend state changes
3. **Single Decision Point**: Only `_layout.tsx` makes routing decisions
4. **No Navigation in Components**: Screens only handle user actions and data updates
5. **Refresh-Based Updates**: After completing actions, refresh user data to get new state

## Configuration

### Onboarding Steps

```typescript
// app/config/onboarding-steps.ts
export interface OnboardingStep {
  id: string;
  title: string;
  route: string;
  description?: string;
  required: boolean;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    route: '/(onboarding)/welcome',
    description: 'Introduction to the app',
    required: true
  },
  {
    id: 'profile-setup',
    title: 'Profile Setup',
    route: '/(onboarding)/profile-setup',
    description: 'Set up your profile',
    required: true
  },
  // Add more steps as needed
];
```

## Implementation

### 1. Navigation Control in _layout.tsx (NEW)

```typescript
// app/_layout.tsx - The ONLY place navigation decisions are made
function RootNavigator() {
  const { isInitialized, user, loading } = useAuth();
  
  // Show loading while checking auth
  if (!isInitialized || loading) {
    return <InitializationScreen />;
  }
  
  // Check 1: Is user authenticated?
  const isAuthenticated = user && user.uid && user.email && user._id;
  
  if (!isAuthenticated) {
    // NOT LOGGED IN → Only auth screens accessible
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
      </Stack>
    );
  }
  
  // Check 2: Has user completed onboarding?
  if (!user.onboardingCompleted) {
    // LOGGED IN but NOT ONBOARDED → Only onboarding screens
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(onboarding)" />
      </Stack>
    );
  }
  
  // LOGGED IN + ONBOARDED → Full app access
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(admin)" />
    </Stack>
  );
}
```

### 2. OnboardingProvider (SIMPLIFIED)

```typescript
// app/providers/onboarding-provider.tsx
export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user, refreshUser } = useAuth();
  
  // Get state from user object (no duplicate fetching!)
  const onboardingCompleted = user?.onboardingCompleted ?? false;
  const currentStep = user?.onboarding?.currentStep ?? 0;
  const totalSteps = ONBOARDING_STEPS.length;
  
  const completeStepMutation = trpc.onboarding.completeStep.useMutation();
  
  const completeStep = async () => {
    // Tell backend to mark current step as complete
    await completeStepMutation.mutateAsync({ 
      action: 'complete' 
    });
    
    // Refresh user data to get new state
    await refreshUser();
    // Navigation happens automatically via _layout.tsx
  };
  
  const skipOnboarding = async () => {
    await completeStepMutation.mutateAsync({ 
      action: 'skip' 
    });
    await refreshUser();
  };
  
  return (
    <OnboardingContext.Provider value={{
      currentStep,
      totalSteps,
      onboardingCompleted,
      completeStep,
      skipOnboarding,
      loading: completeStepMutation.isLoading
    }}>
      {children}
    </OnboardingContext.Provider>
  );
}
```

### 3. Onboarding Navigation Hook

```typescript
// hooks/useOnboardingNavigation.ts
export function useOnboardingNavigation() {
  const { currentStep, totalSteps, onboardingCompleted, completeStep } = useOnboarding();
  
  /**
   * Complete current step and refresh data
   * Navigation happens automatically via _layout.tsx
   */
  const completeAndRefresh = async () => {
    await completeStep();
    // That's it! _layout.tsx handles navigation
  };
  
  const getCurrentStepInfo = () => {
    if (onboardingCompleted) return null;
    return ONBOARDING_STEPS[currentStep] || null;
  };
  
  return {
    completeAndRefresh,
    currentStep,
    totalSteps,
    onboardingCompleted,
    currentStepInfo: getCurrentStepInfo(),
    isLastStep: currentStep >= totalSteps - 1,
  };
}
```

### 4. Onboarding Screen Examples

#### Welcome Screen
```typescript
// app/(onboarding)/welcome/index.tsx
export default function WelcomeScreen() {
  const { currentStep, totalSteps } = useOnboarding();
  const { completeAndRefresh } = useOnboardingNavigation();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleNext = async () => {
    setIsLoading(true);
    try {
      await completeAndRefresh();
      // Navigation happens automatically!
    } catch (error) {
      Alert.alert('Error', 'Failed to continue');
    } finally {
      setIsLoading(false);
    }
  };
  
  const progress = ((currentStep + 1) / totalSteps) * 100;
  
  return (
    <View>
      <ProgressBar progress={progress} />
      <Text>Welcome to the app!</Text>
      <Button
        title="Get Started"
        onPress={handleNext}
        loading={isLoading}
      />
    </View>
  );
}
```

#### Profile Setup Screen
```typescript
// app/(onboarding)/profile-setup/index.tsx
export default function ProfileSetupScreen() {
  const { completeAndRefresh } = useOnboardingNavigation();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isLoading, setIsLoading] = useState(false);
  
  const updateUserMutation = trpc.user.update.useMutation();
  
  const handleComplete = async () => {
    if (!displayName.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }
    
    setIsLoading(true);
    try {
      // Update user profile
      await updateUserMutation.mutateAsync({ 
        displayName: displayName.trim() 
      });
      
      // Complete step - navigation automatic
      await completeAndRefresh();
    } catch (error) {
      Alert.alert('Error', 'Failed to complete setup');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <View>
      <Input
        label="Display Name"
        value={displayName}
        onChangeText={setDisplayName}
      />
      <Button
        title="Complete Setup"
        onPress={handleComplete}
        loading={isLoading}
        disabled={!displayName.trim()}
      />
    </View>
  );
}
```

### 5. TRPC Router Structure

```typescript
// server/routers/onboarding/index.ts
export const onboardingRouter = router({
  completeStep: protectedProcedure
    .input(z.object({
      action: z.enum(['complete', 'navigate']),
    }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      
      if (input.action === 'skip') {
        // Mark onboarding as complete
        await User.findByIdAndUpdate(user._id, {
          onboardingCompleted: true,
          'onboarding.skippedAt': new Date()
        });
      } else {
        // Complete current step
        const currentStep = user.onboarding?.currentStep ?? 0;
        const totalSteps = ONBOARDING_STEPS.length;
        
        if (currentStep >= totalSteps - 1) {
          // Last step - mark complete
          await User.findByIdAndUpdate(user._id, {
            onboardingCompleted: true,
            'onboarding.completedAt': new Date(),
            'onboarding.currentStep': currentStep + 1
          });
        } else {
          // Move to next step
          await User.findByIdAndUpdate(user._id, {
            'onboarding.currentStep': currentStep + 1
          });
        }
      }
      
      return { success: true };
    }),

  resetOnboarding: adminProcedure
    .input(z.object({
      userId: z.string()
    }))
    .mutation(async ({ input }) => {
      await User.findByIdAndUpdate(input.userId, {
        onboardingCompleted: false,
        'onboarding.currentStep': 0,
        'onboarding.completedAt': null,
        'onboarding.skippedAt': null
      });
      
      return { success: true };
    }),
});
```

## Common Patterns

### DO ✅

```typescript
// Let backend control the flow
await completeStep();
await refreshUser();
// Navigation happens automatically

// Show progress based on backend state
const progress = (currentStep / totalSteps) * 100;

// Store step data if needed
await saveStepData({ preferences: selectedOptions });
await completeAndRefresh();
```

### DON'T ❌

```typescript
// Don't navigate manually in onboarding screens
router.push('/(onboarding)/next-step'); // WRONG!

// Don't hardcode step logic
if (currentStep === 0) {
  router.push('/(onboarding)/profile'); // WRONG!
}

// Don't track state locally
const [localStep, setLocalStep] = useState(0); // WRONG!
```

## Adding New Onboarding Steps

1. **Add step to configuration**:
```typescript
// config/onboarding-steps.ts
{
  id: 'preferences',
  title: 'Set Preferences',
  route: '/(onboarding)/preferences',
  required: true
}
```

2. **Create screen component**:
```typescript
// app/(onboarding)/preferences/index.tsx
export default function PreferencesScreen() {
  const { completeAndRefresh } = useOnboardingNavigation();
  // ... implement screen
}
```

3. **Update total steps if needed** (handled automatically via config length)

That's it! The backend-driven flow handles the rest.

## Testing Onboarding

### Manual Testing Checklist

1. **New User Flow**
   - [ ] Creates account → Goes to onboarding
   - [ ] Cannot access main app
   - [ ] Cannot skip required steps
   - [ ] Progress persists on refresh

2. **Step Completion**
   - [ ] Each step completes properly
   - [ ] Navigation happens automatically
   - [ ] Data saves correctly
   - [ ] Can't go backwards

3. **Final Step**
   - [ ] Completes onboarding
   - [ ] Redirects to main app
   - [ ] Cannot return to onboarding

4. **Error Handling**
   - [ ] Network errors show alerts
   - [ ] Can retry failed operations
   - [ ] State remains consistent

### Reset Onboarding (Admin)

```typescript
// For testing - admin only
await trpc.onboarding.resetOnboarding.mutate({ 
  userId: 'user-id' 
});
```

## Debugging

### Check Current State

```typescript
// Add to any onboarding screen
console.log('Onboarding State:', {
  currentStep,
  totalSteps,
  onboardingCompleted,
  userOnboarding: user?.onboarding
});
```

### Common Issues

**Issue**: Stuck on a step
- **Check**: Backend is updating `currentStep`
- **Check**: `refreshUser()` is called after mutations
- **Check**: No errors in completeStep mutation

**Issue**: Skips onboarding entirely
- **Check**: `user.onboardingCompleted` is `false` for new users
- **Check**: `_layout.tsx` properly checks onboarding status

**Issue**: Can access app during onboarding
- **Check**: `_layout.tsx` only renders onboarding stack
- **Check**: No direct navigation to app routes

## Migration Notes

### From Hardcoded Navigation

If migrating from hardcoded step navigation:

1. Remove all `router.push()` calls from onboarding screens
2. Replace with `completeAndRefresh()` calls
3. Update backend to track `currentStep`
4. Let `_layout.tsx` handle all routing
5. Test entire flow end-to-end

### Key Benefits

- **Flexible**: Easy to add/remove/reorder steps
- **Persistent**: Progress saved to backend
- **Consistent**: Single source of truth
- **Simple**: No complex navigation logic
- **Maintainable**: Clear separation of concerns