# Development Guide

## 🎯 Core Principles

1. **Type Safety First** - Use TypeScript strictly
2. **Consistency** - Follow established patterns
3. **Co-location** - Keep related code together
4. **Separation of Concerns** - Clear boundaries between layers
5. **Error Handling** - Never silent failures

## 📁 Project Structure

### Frontend Structure
```
app/
├── app/                  # Pages (Expo Router)
│   ├── (auth)/          # Auth screens
│   ├── (tabs)/          # Main app tabs
│   ├── (onboarding)/    # Onboarding flow
│   └── (admin)/         # Admin screens
├── components/          
│   ├── ui/              # Reusable UI components
│   ├── features/        # Feature-specific components
│   └── common/          # Shared components
├── providers/           # Context providers
├── hooks/              # Custom React hooks
├── styles/             # Theme system
├── types/              # App-specific types
└── utils/              # Helper functions
```

### Backend Structure
```
server/
├── routers/            # TRPC endpoints
│   ├── user/          # User-related procedures
│   ├── onboarding/    # Onboarding procedures
│   ├── notifications/ # Notification procedures
│   └── admin.ts       # Admin procedures
├── services/          # Business logic
├── trpc/             # TRPC configuration
└── *.ts              # Root config files
```

## 🔤 Naming Conventions

### Files
- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Types**: kebab-case (e.g., `user-types.ts`)
- **Styles**: **MUST** be named `index.styles.ts` (no underscore prefix)

#### Style File Naming Convention
**Important**: All component style files MUST be named `index.styles.ts` to prevent Expo Router from treating them as route components:

```
✅ Correct:
components/
  ui/
    Button/
      index.tsx
      index.styles.ts    # Correct naming
    Card/
      index.tsx
      index.styles.ts    # Correct naming

❌ Incorrect:
components/
  ui/
    Button/
      index.tsx
      Button.styles.ts   # Will cause routing errors
```

**Why this matters**:
- Expo Router scans for `.tsx` and `.ts` files to create routes
- Files named `[Component].styles.ts` get mistakenly treated as route files
- This causes build errors and unexpected routing behavior
- Using `index.styles.ts` keeps styles co-located but prevents routing conflicts

### Variables & Functions
```typescript
// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const TOTAL_ONBOARDING_STEPS = 2;

// Functions: camelCase
function calculateTotal() {}
const handleSubmit = () => {};

// Components: PascalCase
function UserProfile() {}
const AdminDashboard = () => {};

// Interfaces/Types: PascalCase
interface UserDocument {}
type ThemeColors = {}

// Enums: PascalCase with UPPER_SNAKE_CASE values
enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}
```

## 🏗️ Component Patterns

### Authentication Form Layout

For authentication screens (login, signup, forgot password), use the shared `AuthFormLayout` component:

```typescript
// app/(auth)/login/index.tsx
import { AuthFormLayout } from '@/components/features';

export default function LoginScreen() {
  return (
    <AuthFormLayout
      title="Welcome Back"
      subtitle="Sign in to continue"
      bottomLinks={[
        {
          text: "Don't have an account?",
          linkText: "Sign Up",
          href: "/signup",
        },
      ]}
    >
      <Card style={styles.formCard}>
        {/* Your form fields here */}
      </Card>
    </AuthFormLayout>
  );
}
```

This provides consistent layout, keyboard handling, and navigation across all auth screens.

### Basic Component Structure
```typescript
// components/features/UserCard/index.tsx
import React from 'react';
import { View } from 'react-native';
import { useThemedStyles } from '@/styles';
import { createStyles } from './styles';
import { Text, Button } from '@/components/ui';

interface UserCardProps {
  user: User;
  onPress?: () => void;
}

export function UserCard({ user, onPress }: UserCardProps) {
  const styles = useThemedStyles(createStyles);
  
  return (
    <View style={styles.container}>
      <Text variant="h3">{user.displayName}</Text>
      {onPress && (
        <Button title="View Profile" onPress={onPress} />
      )}
    </View>
  );
}
```

### Component Styles
```typescript
// components/features/UserCard/index.styles.ts (MUST be named index.styles.ts)
import { Theme } from '@/types/theme';

export const createStyles = (theme: Theme) => ({
  container: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
});
```

**Critical**: Always name style files `index.styles.ts` to prevent Expo Router conflicts.

## 🪝 Hook Patterns

### Custom Hook Structure
```typescript
// hooks/useUserData.ts
import { useState, useEffect } from 'react';
import { trpc } from '@/providers/trpc-provider';

export function useUserData(userId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { data, isLoading, error: queryError } = trpc.user.getUser.useQuery(
    { userId },
    { enabled: !!userId }
  );
  
  useEffect(() => {
    setLoading(isLoading);
    setError(queryError);
  }, [isLoading, queryError]);
  
  return {
    user: data,
    loading,
    error,
    refetch: () => {}, // Add refetch logic
  };
}
```

## 🌐 Provider Patterns

### Context Provider Template
```typescript
// providers/feature-provider.tsx
import React, { createContext, useContext, useState } from 'react';

interface FeatureContextValue {
  data: any;
  loading: boolean;
  updateData: (data: any) => void;
}

const FeatureContext = createContext<FeatureContextValue | null>(null);

export function FeatureProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const updateData = (newData: any) => {
    setData(newData);
  };
  
  return (
    <FeatureContext.Provider value={{ data, loading, updateData }}>
      {children}
    </FeatureContext.Provider>
  );
}

export function useFeature() {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error('useFeature must be used within FeatureProvider');
  }
  return context;
}
```

## 🔌 TRPC Patterns

### Router Structure
```typescript
// server/routers/feature.ts
import { z } from 'zod';
import { router, protectedProcedure, adminProcedure } from '@/trpc/trpc';
import { TRPCError } from '@trpc/server';

export const featureRouter = router({
  // Query - GET data
  getItem: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      
      const item = await db.collection('items').findOne({
        _id: new ObjectId(input.id),
        userId: user._id,
      });
      
      if (!item) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Item not found',
        });
      }
      
      return item;
    }),
  
  // Mutation - Modify data
  createItem: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      
      const result = await db.collection('items').insertOne({
        ...input,
        userId: user._id,
        createdAt: new Date(),
      });
      
      return { id: result.insertedId };
    }),
});
```

### Using TRPC in Frontend
```typescript
// In component
import { trpc } from '@/providers/trpc-provider';

function MyComponent() {
  // Query
  const { data, isLoading, error } = trpc.feature.getItem.useQuery({
    id: 'item-id',
  });
  
  // Mutation
  const createItem = trpc.feature.createItem.useMutation({
    onSuccess: (data) => {
      console.log('Created:', data);
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });
  
  const handleCreate = () => {
    createItem.mutate({
      name: 'New Item',
      description: 'Description',
    });
  };
}
```

## 📝 Type Patterns

### Shared Types (in `/types/`)
```typescript
// types/feature.ts
import { z } from 'zod';

// Core interface
export interface Feature {
  id: string;
  name: string;
  enabled: boolean;
  metadata?: Record<string, any>;
}

// Zod schema for validation
export const createFeatureSchema = z.object({
  name: z.string().min(1).max(100),
  enabled: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
});

// Inferred type from schema
export type CreateFeatureInput = z.infer<typeof createFeatureSchema>;
```

### App-Specific Types
```typescript
// app/types/navigation.ts
export type RootStackParamList = {
  Home: undefined;
  Profile: { userId: string };
  Settings: undefined;
};
```

### Component Types (Co-located)
```typescript
// In component file
interface ComponentProps {
  title: string;
  onPress: () => void;
}

interface ComponentState {
  isExpanded: boolean;
  selectedItems: string[];
}
```

## 🎨 Style Patterns

### Theme-Aware Styles
```typescript
// Always use theme for colors, spacing, etc.
export const createStyles = (theme: Theme) => ({
  container: {
    // Good - uses theme
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    
    // Bad - hardcoded values
    // backgroundColor: '#ffffff',
    // padding: 16,
  },
});
```

### Responsive Styles
```typescript
import { Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export const createStyles = (theme: Theme) => ({
  container: {
    width: screenWidth > 768 ? '50%' : '100%',
    maxWidth: 600,
  },
});
```

## ⚡ Performance Best Practices

### 1. Memoization
```typescript
// Memoize expensive computations
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);

// Memoize callbacks
const handlePress = useCallback(() => {
  doSomething(id);
}, [id]);
```

### 2. Lazy Loading
```typescript
// Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// In render
<Suspense fallback={<LoadingScreen />}>
  <HeavyComponent />
</Suspense>
```

### 3. Query Optimization
```typescript
// Use query options wisely
const { data } = trpc.user.getUser.useQuery(undefined, {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false,
});
```

## 🐛 Error Handling

### Simple Error Utilities

We use simple, consistent error handling patterns:

#### Backend Error Handling
```typescript
// server/utils/errors.ts provides simple error helpers
import { errors } from '@/utils/errors';

// Instead of creating new TRPCError everywhere:
throw errors.notFound('User');
throw errors.unauthorized('Invalid credentials');
throw errors.badRequest('Missing required fields');
throw errors.internal('Database connection failed');
```

#### Frontend Error Handling
```typescript
// app/utils/error-handler.ts provides consistent error handling
import { handleError } from '@/utils/error-handler';

// In components:
try {
  await someOperation();
} catch (error) {
  handleError(error, 'Operation failed');
}
```

### Frontend Error Boundaries
```typescript
// components/common/ErrorBoundary.tsx
class ErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
    // Log to error service
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorScreen />;
    }
    return this.props.children;
  }
}
```

### TRPC Error Handling
```typescript
// Specific error codes
throw new TRPCError({
  code: 'UNAUTHORIZED', // Use specific codes
  message: 'You do not have permission to perform this action',
});

// Frontend handling
const mutation = trpc.feature.update.useMutation({
  onError: (error) => {
    if (error.data?.code === 'UNAUTHORIZED') {
      Alert.alert('Permission Denied', error.message);
    } else {
      Alert.alert('Error', 'Something went wrong');
    }
  },
});
```

## 🧪 Testing Approach

### Component Testing
```typescript
// __tests__/UserCard.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { UserCard } from '../UserCard';

describe('UserCard', () => {
  it('displays user name', () => {
    const { getByText } = render(
      <UserCard user={{ displayName: 'John Doe' }} />
    );
    expect(getByText('John Doe')).toBeTruthy();
  });
  
  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <UserCard user={mockUser} onPress={onPress} />
    );
    fireEvent.press(getByText('View Profile'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

## 📱 Cross-Platform Development

### Platform-Specific Code

```typescript
// Use Platform for OS-specific logic
import { Platform } from 'react-native';

const styles = {
  shadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 4,
    },
    web: {
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
  }),
};

// Platform-specific components
const MyComponent = Platform.select({
  ios: () => require('./MyComponent.ios').default,
  android: () => require('./MyComponent.android').default,
  web: () => require('./MyComponent.web').default,
})();
```

### @shared Imports Configuration

The project is configured to support `@shared` path aliases that work across iOS, Android, and Web:

#### Metro Configuration (`app/metro.config.js`)
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Configure path aliases
config.resolver.alias = {
  '@shared': path.resolve(__dirname, '../'),
  '@': path.resolve(__dirname, './'),
};

// Watch shared directories
config.watchFolders = [
  path.resolve(__dirname, '../types'),
  path.resolve(__dirname, '../server'),
];

module.exports = config;
```

#### Using @shared Imports
```typescript
// Import shared types from root level
import { User } from '@shared/types/user';
import { OnboardingStep } from '@shared/types/onboarding';

// Import local app files
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
```

### Cross-Platform Considerations

#### Web Compatibility
- **Firebase Auth**: Automatically uses localStorage on web, AsyncStorage on mobile
- **Navigation**: Expo Router works seamlessly across all platforms
- **Styling**: Use Platform.select for platform-specific styles
- **Storage**: AsyncStorage polyfills to localStorage on web

#### iOS Considerations
- **Safe Areas**: Use `useSafeAreaInsets()` for proper spacing
- **Navigation**: Handle iOS-specific navigation patterns
- **Icons**: Use platform-appropriate icon styles

#### Android Considerations
- **Material Design**: Follow Android design guidelines
- **Back Button**: Handle Android hardware back button
- **Status Bar**: Configure status bar appearance

#### Performance Optimization
```typescript
// Platform-specific optimizations
const optimizedStyles = Platform.select({
  ios: {
    // iOS-specific optimizations
    transform: [{ translateZ: 0 }], // Enable hardware acceleration
  },
  android: {
    // Android-specific optimizations
    elevation: 0, // Reduce overdraw
  },
  web: {
    // Web-specific optimizations
    willChange: 'transform', // Optimize for animations
  },
});
```

## 🚀 Deployment Checklist

### Before Deploying
- [ ] Run TypeScript compiler: `tsc --noEmit`
- [ ] Run linter: `npm run lint`
- [ ] Test authentication flow (signup, login, logout)
- [ ] Verify auth redirects work correctly
- [ ] Test on iOS simulator
- [ ] Test on Android emulator
- [ ] Check environment variables (especially apiConfig imports)
- [ ] Review error handling (console errors only)
- [ ] Check loading states
- [ ] Verify offline behavior
- [ ] Ensure all style files are named `index.styles.ts`

### Environment Setup
```bash
# Development
cp .env.example .env.development

# Production
cp .env.example .env.production
# Update with production values
```

## 🔍 Debugging Tips

### Console Logging Strategy

The app uses minimal console logging for production readiness. Here's what to expect:

```typescript
// Error logs are preserved for debugging
console.error('[AuthProvider] Failed to fetch user profile after retries:', error);
console.error('[TRPC] Response not OK:', status, statusText);
console.error('[TRPC] Fetch error:', error);

// Info/debug logs have been removed for cleaner output
// Add temporary debug logs when needed:
if (__DEV__) {
  console.log('Debug:', data);
}
```

### Common Debugging Scenarios

#### Authentication Issues
```typescript
// Check auth state in _layout.tsx
useEffect(() => {
  if (__DEV__) {
    console.log('Auth state:', {
      isInitialized,
      hasUser: !!user,
      userId: user?._id,
      onboardingCompleted: user?.onboardingCompleted
    });
  }
}, [isInitialized, user]);
```

#### TRPC Connection Issues
```typescript
// TRPC errors appear as:
// [TRPC] Response not OK: 401 Unauthorized
// [TRPC] Fetch error: NetworkError

// Check API configuration:
console.log('API URL:', apiConfig.baseUrl);
console.log('Auth token exists:', !!auth.currentUser);
```

#### Signup Flow Debugging
```typescript
// Auth provider has retry logic for new users
// If signup fails, check:
// 1. Backend server is running (port 3000)
// 2. EXPO_PUBLIC_API_URL is correct
// 3. Firebase user was created successfully
// 4. apiConfig is imported in auth provider
```

### React Native Debugger
```typescript
// Use React DevTools
// Shake device or Cmd+D (iOS) / Cmd+M (Android)
```

### TRPC Logging
```typescript
// TRPC client has built-in error logging
// Errors show as [TRPC] Response not OK
// Network errors show as [TRPC] Fetch error
```

### MongoDB Queries
```typescript
// Log slow queries
db.collection('users').find(query).explain('executionStats');
```

## 📚 Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [TRPC Documentation](https://trpc.io/docs)
- [MongoDB Best Practices](https://www.mongodb.com/docs/manual/best-practices/)