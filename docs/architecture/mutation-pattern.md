# TRPC Mutation Pattern - Implementation Complete

## What We Implemented

We've successfully implemented the proper TRPC/React Query pattern where **mutations return complete updated data** and the frontend automatically updates both the auth state and query cache.

## The Pattern

### Backend: Mutations Return Full Data

```typescript
// Example: onboarding/index.ts
updateOnboarding: protectedProcedure.mutation(async ({ ctx, input }) => {
  // 1. Perform the update
  await updateDatabase();
  
  // 2. Fetch the complete updated user
  const updatedUser = await usersCollection.findOne({
    _id: new ObjectId(user._id)
  });
  
  // 3. Return the full user object
  return updatedUser;
});
```

### Frontend: Auto-Update on Success

```typescript
// Example: OnboardingProvider
const completeStepMutation = trpc.onboarding.updateOnboarding.useMutation({
  onSuccess: (updatedUser) => {
    // Update auth provider state
    setUser(updatedUser);
    // Update React Query cache
    utils.user.get.setData(undefined, updatedUser);
  }
});

// Usage is simple - no manual refresh needed
await completeStepMutation.mutateAsync({ action: 'complete' });
```

## Files Modified

### Backend Changes (Return Full User)
- ✅ `/server/routers/onboarding/index.ts` - Returns complete user after update
- ✅ `/server/routers/user/update-user.ts` - Already returned user
- ✅ `/server/routers/user/create-user.ts` - Already returned user
- ✅ `/server/routers/payment/subscribe.ts` - Returns user with subscription
- ✅ `/server/routers/payment/cancel.ts` - Returns user with updated status

### Frontend Changes (Use Returned Data)
- ✅ `/app/providers/auth-provider.tsx` - Exposed `setUser`, simplified `refreshUser`
- ✅ `/app/providers/onboarding-provider.tsx` - Updates cache onSuccess
- ✅ `/app/components/features/user/UserProfile.tsx` - Updates cache onSuccess
- ✅ `/app/providers/payment-provider.web.tsx` - Updates cache onSuccess
- ✅ `/app/providers/payment-provider.native.tsx` - Updates cache onSuccess
- ✅ `/app/app/(tabs)/settings/index.tsx` - Updates cache onSuccess
- ✅ `/app/app/(onboarding)/profile-setup/index.tsx` - Updates cache onSuccess

### Configuration
- ✅ `/app/lib/api.ts` - Proper caching defaults (5 min stale time)

## Benefits Achieved

1. **No Manual Refresh Needed** - Mutations automatically update state
2. **Single Source of Truth** - Auth provider state stays in sync
3. **Optimal Performance** - One round trip, no extra fetches
4. **Cache Consistency** - React Query cache always accurate
5. **Simple Code** - Standard TRPC pattern, easy to understand

## How It Works

### Before (Old Pattern - Bad)
```typescript
// Mutation returns minimal data
mutation: async () => {
  await updateDB();
  return { success: true };
}

// Frontend manually refreshes
await mutation();
await refreshUser(); // Extra round trip!
```

### After (New Pattern - Good)
```typescript
// Mutation returns complete data
mutation: async () => {
  await updateDB();
  return getCompleteUser();
}

// Frontend auto-updates
const mutation = useMutation({
  onSuccess: (userData) => {
    setUser(userData);
    utils.user.get.setData(undefined, userData);
  }
});

await mutation(); // That's it!
```

## Key Insights

1. **Mutations should be "complete operations"** - They do the work AND return the result
2. **onSuccess is powerful** - Use it to update all relevant state
3. **Cache invalidation is rarely needed** - Just update with fresh data
4. **TRPC context (ctx.user) can be stale** - Always fetch fresh in queries

## Testing Checklist

- [x] Onboarding updates move to next step
- [x] Profile updates reflect immediately  
- [x] Payment changes update subscription status
- [x] Settings changes show instantly
- [x] No manual refreshUser calls needed
- [x] Cache stays consistent

## Migration Complete

The app now follows TRPC best practices. Every mutation returns complete data, and the frontend automatically updates both auth state and React Query cache. This is maintainable, performant, and follows the framework's design.

## Future Guidelines

When adding new mutations:

1. **Always return the complete updated entity**
2. **Use onSuccess to update relevant state**
3. **Don't manually invalidate or refresh**
4. **Let React Query handle the caching**

This pattern scales well and keeps the codebase clean and predictable.