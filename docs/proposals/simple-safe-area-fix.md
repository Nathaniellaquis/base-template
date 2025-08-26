# Simple Safe Area Fix

## The Problem
Every screen needs to manually handle safe areas. It's repetitive and easy to forget.

## The Solution
Just wrap each layout file with SafeAreaView. That's it!

## Implementation

### 1. Tab Layout
```typescript
// app/(tabs)/_layout.tsx
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabLayout() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Tabs screenOptions={{ headerShown: false }}>
        {/* tabs */}
      </Tabs>
    </SafeAreaView>
  );
}
```

### 2. Auth Layout
```typescript
// app/(auth)/_layout.tsx
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthLayout() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* auth screens */}
      </Stack>
    </SafeAreaView>
  );
}
```

### 3. Onboarding Layout
```typescript
// app/(onboarding)/_layout.tsx
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingLayout() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* onboarding screens */}
      </Stack>
    </SafeAreaView>
  );
}
```

### 4. Admin Layout
```typescript
// app/(admin)/_layout.tsx
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminLayout() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* admin screens */}
      </Stack>
    </SafeAreaView>
  );
}
```

## That's It!

- **4 layout files** instead of 20+ screens
- **Zero changes** to individual screens
- **Zero imports** in screen files
- **It just works**

## How It Works

- Tab screens: `edges={['top']}` - only top padding (tab bar handles bottom)
- Auth/Onboarding: `edges={['top', 'bottom']}` - full screen protection
- Admin: `edges={['top']}` - standard app screen

Every screen inside these layouts automatically inherits the safe area padding. No more thinking about it!

## Benefits

1. **DRY** - Fix once per layout, not per screen
2. **Clean** - Individual screens stay focused on content
3. **Automatic** - New screens get safe areas for free
4. **Performant** - No extra hooks or context lookups
5. **Simple** - Anyone can understand this in 5 seconds

The simplest solution is often the best solution.