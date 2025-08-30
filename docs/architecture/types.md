# Types Architecture Documentation

## Overview

This document outlines the TypeScript type patterns and best practices used throughout the application, with special focus on tRPC integration and route typing.

## tRPC Type Patterns

### Proper Hook Usage

tRPC provides different hooks for different purposes. Using the correct hook is critical for type safety:

#### 1. useContext vs useUtils

**❌ Common Mistake:**
```typescript
// This is WRONG - useContext doesn't exist in tRPC v10+
const ctx = api.useContext()
```

**✅ Correct Usage:**
```typescript
// Use useUtils for cache invalidation and other utilities
const utils = api.useUtils()

// Invalidate queries
await utils.user.getProfile.invalidate()

// Set query data
utils.user.getProfile.setData({ id: userId }, newData)
```

#### 2. Query vs Mutation Hooks

**❌ Wrong:**
```typescript
// Using query hook for mutations
const { data } = api.user.updateProfile.useQuery({ name: 'John' })
```

**✅ Correct:**
```typescript
// Use mutation hook for mutations
const updateProfile = api.user.updateProfile.useMutation()

// Execute mutation
await updateProfile.mutateAsync({ name: 'John' })
```

### tRPC Router Type Inference

The tRPC router automatically infers types from your procedures:

```typescript
// server/routers/user.ts
export const userRouter = router({
  getProfile: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Return type is automatically inferred
      return await getUserProfile(input.userId)
    }),
    
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      email: z.string().email().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      return await updateUser(ctx.user.id, input)
    })
})

// Client automatically has full type safety
const { data } = api.user.getProfile.useQuery({ userId: '123' })
// data is typed as the return type of getUserProfile
```

### Error Handling with tRPC

```typescript
// Proper error handling pattern
const mutation = api.user.updateProfile.useMutation({
  onError: (error) => {
    // error.message is the TRPCError message
    console.error('Update failed:', error.message)
  },
  onSuccess: (data) => {
    // data is fully typed
    console.log('Profile updated:', data.name)
  }
})
```

## Expo Router Typing

### Route Parameters

Proper typing for Expo Router navigation:

```typescript
// types/navigation.ts
export type RootStackParamList = {
  Home: undefined
  Profile: { userId: string }
  Settings: { section?: 'account' | 'privacy' | 'notifications' }
}

// In components
import { useLocalSearchParams } from 'expo-router'
import type { RootStackParamList } from '@/types/navigation'

export default function ProfileScreen() {
  // Properly typed params
  const params = useLocalSearchParams<RootStackParamList['Profile']>()
  const userId = params.userId // string
}
```

### Link Components

```typescript
import { Link } from 'expo-router'

// Type-safe navigation
<Link
  href={{
    pathname: '/profile/[userId]',
    params: { userId: user.id }
  }}
>
  View Profile
</Link>
```

### Programmatic Navigation

```typescript
import { useRouter } from 'expo-router'

const router = useRouter()

// Navigate with type safety
router.push({
  pathname: '/settings',
  params: { section: 'privacy' }
})
```

## Component Type Patterns

### Props with Children

```typescript
// Proper typing for components with children
interface LayoutProps {
  title: string
  children: React.ReactNode // Not ReactElement or JSX.Element
}

export function Layout({ title, children }: LayoutProps) {
  return (
    <View>
      <Text>{title}</Text>
      {children}
    </View>
  )
}
```

### Event Handlers

```typescript
// Properly typed event handlers
interface ButtonProps {
  onPress: () => void // Not 'Function' or 'any'
  onLongPress?: () => Promise<void>
}

// With parameters
interface InputProps {
  onChange: (value: string) => void
  onFocus?: (event: NativeSyntheticEvent<TextInputFocusEventData>) => void
}
```

## State Management Types

### Context Types

```typescript
// Define context value type
interface AuthContextValue {
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

// Create context with proper type
const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// Type-safe hook
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context // Fully typed!
}
```

### Reducer Types

```typescript
// Action types
type AuthAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SIGN_OUT' }

// State type
interface AuthState {
  user: User | null
  isLoading: boolean
}

// Reducer with exhaustive checking
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SIGN_OUT':
      return { ...state, user: null }
    default:
      // TypeScript ensures this is unreachable
      const _exhaustive: never = action
      return state
  }
}
```

## API Response Types

### Generic Response Wrapper

```typescript
// Generic API response type
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

// Usage
type UserResponse = ApiResponse<User>
type UsersResponse = ApiResponse<User[]>
```

### Discriminated Unions

```typescript
// Better than optional properties
type ApiResult<T> =
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }
  | { status: 'loading' }

// Usage with type narrowing
function handleResult<T>(result: ApiResult<T>) {
  switch (result.status) {
    case 'success':
      console.log(result.data) // T
      break
    case 'error':
      console.error(result.error) // Error
      break
    case 'loading':
      console.log('Loading...')
      break
  }
}
```

## Utility Types

### Common Patterns

```typescript
// Make all properties optional except specified
type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>

// Example usage
type UpdateUserInput = PartialExcept<User, 'id'>
// id is required, everything else optional

// Deep readonly
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

// Nullable type
type Nullable<T> = T | null | undefined

// Extract promise type
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T
```

### Type Guards

```typescript
// User-defined type guards
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value
  )
}

// Array type guard
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string')
}

// Usage
const data: unknown = await fetchData()
if (isUser(data)) {
  console.log(data.email) // Safe to access
}
```

## Best Practices

1. **Prefer Interface over Type** for object shapes (better error messages)
2. **Use Type** for unions, intersections, and utility types
3. **Enable Strict Mode** in tsconfig.json
4. **Avoid any** - use `unknown` when type is truly unknown
5. **Use const assertions** for literal types
6. **Leverage type inference** - don't over-annotate
7. **Export types separately** from implementations

## Common Pitfalls

1. **Incorrect tRPC hook usage** - Always check the API reference
2. **Missing return types** - Let TypeScript infer when possible
3. **Overusing type assertions** - Validate at runtime when needed
4. **Circular type dependencies** - Structure types hierarchically
5. **Not using discriminated unions** - They enable exhaustive checking