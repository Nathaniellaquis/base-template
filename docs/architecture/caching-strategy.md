# Caching Strategy

## Philosophy
Cache by default for performance, but provide explicit mechanisms to bypass cache when data freshness is critical.

## The Problem We Solved
- **Issue**: After updating onboarding, cached user data prevented navigation
- **Root Cause**: No clear way to force fresh data when needed
- **Solution**: Explicit cache control with clear patterns

## Caching Rules

### 1. Cache These (Performance Wins)
```typescript
// Static or rarely changing data
- User lists (admin panel)
- Subscription plans
- Historical data
- Read-heavy operations

// Example: Cache for 5 minutes
trpc.admin.getUsers.useQuery(undefined, {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000,   // 10 minutes
});
```

### 2. Never Cache These (Always Fresh)
```typescript
// Critical state that affects navigation/access
- User profile after mutations
- Onboarding status
- Payment/subscription status
- Auth state

// Example: Always fresh
trpc.user.get.useQuery(undefined, {
  staleTime: 0,
  gcTime: 0,
});
```

### 3. Invalidate After Mutations
```typescript
// After any mutation that changes data
const utils = trpc.useContext();

const updateUser = trpc.user.update.useMutation({
  onSuccess: () => {
    // Invalidate specific query
    utils.user.get.invalidate();
    // Or invalidate all user queries
    utils.user.invalidate();
  }
});
```

## Implementation Pattern

### Option 1: Custom Hooks with Clear Intent

```typescript
// app/hooks/useUser.ts
export function useUser(options?: { fresh?: boolean }) {
  return trpc.user.get.useQuery(undefined, {
    staleTime: options?.fresh ? 0 : 5 * 60 * 1000,
    gcTime: options?.fresh ? 0 : 10 * 60 * 1000,
  });
}

// Usage - Clear intent
const { data: user } = useUser({ fresh: true });  // Always fresh
const { data: user } = useUser();                  // Cached for 5 min
```

### Option 2: Separate Endpoints for Different Needs

```typescript
// server/routers/user.ts
export const userRouter = router({
  // Cached version for general use
  get: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user; // Can use ctx.user, it's fine for cached
  }),
  
  // Always fresh for critical operations
  getFresh: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.users.findOne({ _id: ctx.user._id });
    return user; // Always from database
  }),
});

// Client usage
const { data: user } = trpc.user.get.useQuery();      // Cached
const { data: user } = trpc.user.getFresh.useQuery(); // Always fresh
```

### Option 3: Query Options Helper

```typescript
// app/lib/query-options.ts
export const queryOptions = {
  // For data that rarely changes
  static: {
    staleTime: 60 * 60 * 1000,  // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 1 day
  },
  
  // For user-specific data
  user: {
    staleTime: 5 * 60 * 1000,   // 5 minutes
    gcTime: 10 * 60 * 1000,      // 10 minutes
  },
  
  // For critical auth/navigation data
  critical: {
    staleTime: 0,                // Always stale
    gcTime: 0,                   // Never cache
  },
  
  // For frequently updating data
  realtime: {
    staleTime: 10 * 1000,        // 10 seconds
    gcTime: 30 * 1000,           // 30 seconds
  },
};

// Usage
trpc.user.get.useQuery(undefined, queryOptions.critical);
trpc.notifications.list.useQuery(undefined, queryOptions.realtime);
trpc.plans.list.useQuery(undefined, queryOptions.static);
```

## Specific Fixes for Our App

### 1. Onboarding Flow
```typescript
// app/providers/onboarding-provider.tsx
const completeStep = async () => {
  await completeStepMutation.mutateAsync({ action: 'complete' });
  
  // Option A: Invalidate the query
  utils.user.get.invalidate();
  
  // Option B: Use getFresh endpoint
  const freshUser = await trpc.user.getFresh.query();
  setUser(freshUser);
};
```

### 2. Auth Provider
```typescript
// app/providers/auth-provider.tsx
const refreshUser = async () => {
  // For auth, ALWAYS get fresh data
  const userProfile = await trpcClient.user.get.query({
    // Force fresh fetch
    trpc: { 
      context: { 
        skipCache: true 
      } 
    }
  });
  setUser(userProfile);
};
```

### 3. Payment Updates
```typescript
// After successful payment
const handlePayment = async () => {
  await subscribe();
  
  // Invalidate both user and subscription
  await Promise.all([
    utils.user.get.invalidate(),
    utils.payment.getSubscription.invalidate(),
  ]);
};
```

## Best Practices

### DO ✅
- **Be explicit** about caching intent
- **Document** why something is cached or not
- **Invalidate** after mutations
- **Use fresh data** for auth/permissions
- **Cache** read-heavy, static data

### DON'T ❌
- **Cache** authentication state
- **Cache** payment/subscription status
- **Assume** cache will be invalidated
- **Mix** cached and fresh data in same component
- **Cache** user permissions/roles

## Migration Plan

### Phase 1: Add Explicit Options
```typescript
// Update React Query client with sensible defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 min default
      gcTime: 10 * 60 * 1000,     // 10 min default
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

### Phase 2: Identify Critical Queries
```typescript
// Mark these as always fresh:
- user.get (when used for navigation)
- payment.getSubscription
- admin.checkPermissions
- onboarding.getStatus
```

### Phase 3: Add Cache Control
```typescript
// Add to each query based on needs
const { data } = trpc.something.useQuery(undefined, {
  ...queryOptions.critical, // or .user, .static, .realtime
});
```

## Example: Fixed Onboarding Flow

```typescript
// server/routers/user/get-user.ts
export const userRouter = router({
  // Regular cached version
  get: protectedProcedure.query(async ({ ctx }) => {
    // Can use ctx.user for cached version
    return attachOnboardingData(ctx.user);
  }),
  
  // Always fresh version
  getFresh: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.users.findOne({ _id: ctx.user._id });
    return attachOnboardingData(user);
  }),
});

// app/providers/onboarding-provider.tsx
const completeStep = async () => {
  // Update onboarding
  await completeStepMutation.mutateAsync({ action: 'complete' });
  
  // Get fresh user data (no cache)
  const freshUser = await trpc.user.getFresh.query();
  setUser(freshUser);
};

// app/app/_layout.tsx
function RootNavigator() {
  // Use cached version for initial load (fast)
  const { data: user } = trpc.user.get.useQuery();
  
  // But after mutations, use getFresh
  // This is handled in the mutation callbacks
}
```

## Benefits of This Approach

1. **Performance**: Cache where it helps
2. **Correctness**: Fresh data where it matters
3. **Clarity**: Explicit about caching intent
4. **Flexibility**: Different strategies for different needs
5. **Debugging**: Easy to see what's cached vs fresh

## Monitoring

Add logging to track cache hits/misses:

```typescript
// app/lib/api.ts
queryClient.setDefaultOptions({
  queries: {
    onSuccess: (data) => {
      console.log('[Cache] Query success', { 
        cached: data._cached, 
        timestamp: Date.now() 
      });
    },
  },
});
```

## Conclusion

Instead of disabling all caching (losing performance) or fighting with implicit caching (causing bugs), we should:

1. **Cache by default** for performance
2. **Be explicit** when we need fresh data
3. **Invalidate** after mutations
4. **Document** our caching decisions

This gives us the best of both worlds: performance when we want it, correctness when we need it.