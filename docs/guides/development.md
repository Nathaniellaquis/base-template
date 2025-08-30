# Development Guide

## TypeScript Best Practices

### Running TypeScript Checks

Always run TypeScript compilation checks before committing:

```bash
# Check app TypeScript
cd app && npx tsc --noEmit

# Check server TypeScript  
cd server && npx tsc --noEmit

# Check both
npm run type-check
```

### Common Error Patterns and Solutions

#### 1. tRPC Type Errors

**Problem**: Using `useContext` instead of `useUtils` for tRPC utilities

```typescript
// ❌ Wrong
const utils = api.useContext()

// ✅ Correct
const utils = api.useUtils()
```

**Problem**: Incorrect mutation/query usage

```typescript
// ❌ Wrong
const { data } = api.user.update.useQuery()

// ✅ Correct
const mutation = api.user.update.useMutation()
```

#### 2. React Hook Dependencies

**Problem**: Missing dependencies in useEffect/useCallback

```typescript
// ❌ Wrong
useEffect(() => {
  doSomething(value)
}, []) // Missing 'value' dependency

// ✅ Correct
useEffect(() => {
  doSomething(value)
}, [value])
```

#### 3. Type Assertions

**Problem**: Using type guards when simple assertions work

```typescript
// ❌ Overly complex
function hasSubscriptionDates(sub: any): sub is SubscriptionWithDates {
  return sub && typeof sub.currentPeriodStart === 'string'
}

// ✅ Simple and clear
const subscription = rawData as SubscriptionWithDates
```

#### 4. Async/Await in Hooks

**Problem**: Not handling async operations properly

```typescript
// ❌ Wrong
useEffect(async () => {
  await fetchData()
}, [])

// ✅ Correct
useEffect(() => {
  const load = async () => {
    await fetchData()
  }
  load()
}, [])
```

### Type Safety Tips

1. **Use Strict Mode**: Ensure `tsconfig.json` has `"strict": true`
2. **Avoid `any`**: Use `unknown` when type is truly unknown
3. **Leverage Type Inference**: Let TypeScript infer types when possible
4. **Use Const Assertions**: For literal types use `as const`

```typescript
// Type inference example
const config = {
  apiUrl: process.env.API_URL,
  enableFeature: true
} as const // Now config.enableFeature is literal type 'true'
```

### Import Best Practices

1. **Use Path Aliases**: Prefer `@/components` over `../../components`
2. **Organize Imports**: Group by external, internal, types
3. **Avoid Circular Dependencies**: Structure modules hierarchically

```typescript
// Good import organization
import React from 'react' // External
import { View } from 'react-native' // External

import { api } from '@/lib/api' // Internal absolute
import { Button } from '@/components/ui' // Internal absolute

import type { User } from '@/types' // Type imports last
```

### Error Handling Patterns

```typescript
// Consistent error handling
try {
  const result = await riskyOperation()
  return { success: true, data: result }
} catch (error) {
  console.error('Operation failed:', error)
  return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
}
```

### Testing TypeScript

1. **Type Test Files**: Use `.test-d.ts` for type tests
2. **Runtime Tests**: Ensure types match runtime behavior
3. **Mock Types**: Create proper types for mocks

```typescript
// Type testing example
import { expectType } from 'tsd'

expectType<string>(getUserName({ id: '1', name: 'John' }))
```

## Development Workflow

### 1. Before Starting Work

```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Run type checks
npm run type-check
```

### 2. During Development

- Keep TypeScript compiler running: `tsc --watch`
- Fix errors immediately as they appear
- Use ESLint auto-fix: `npm run lint:fix`

### 3. Before Committing

```bash
# Run all checks
npm run type-check
npm run lint
npm run test

# Commit with confidence
git add .
git commit -m "feat: add new feature with proper types"
```

## Debugging Tips

### TypeScript Errors

1. **Read Error Messages Carefully**: TypeScript errors are verbose but informative
2. **Check tsconfig.json**: Ensure paths and settings are correct
3. **Use TypeScript Playground**: Test complex types in isolation
4. **Enable Source Maps**: For better debugging experience

### Common Solutions

- **Cannot find module**: Check path aliases in tsconfig.json
- **Type not assignable**: Look for subtle differences in types
- **Property does not exist**: Ensure interfaces are properly extended
- **Circular dependency**: Refactor to break the cycle

## Performance Tips

1. **Use `skipLibCheck`**: Speed up compilation for node_modules
2. **Incremental Builds**: Enable `incremental` in tsconfig.json
3. **Project References**: Use for large monorepos
4. **Exclude Unnecessary Files**: Configure `exclude` properly