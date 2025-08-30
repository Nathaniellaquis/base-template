# Workspace Feature Documentation

## Overview

The workspace feature allows users to organize their work into separate workspaces, providing multi-tenancy capabilities within the application. This feature is **optional** and can be toggled via the `ENABLE_WORKSPACES` environment variable.

## Feature Toggle

### Enabling/Disabling Workspaces

The workspace feature is controlled by the `ENABLE_WORKSPACES` environment variable:

```bash
# Enable workspaces
ENABLE_WORKSPACES=true

# Disable workspaces (default)
ENABLE_WORKSPACES=false
```

### Implementation Pattern

The workspace feature uses a **router stub pattern** when disabled to maintain type safety and prevent runtime errors:

```typescript
// server/routers/workspace/index.ts
import { router } from '../../trpc'
import { protectedProcedure } from '../../trpc/middleware'

export const workspaceRouter = router({
  // When workspaces are disabled, all procedures throw an error
  getAll: protectedProcedure.query(async () => {
    throw new Error('Workspace feature is disabled')
  }),
  
  create: protectedProcedure.input(createWorkspaceInput).mutation(async () => {
    throw new Error('Workspace feature is disabled')
  }),
  
  // ... other stub procedures
})
```

### Conditional Import System

The application uses conditional imports based on the feature flag:

```typescript
// server/trpc/app.ts
import { createTRPCRouter } from './trpc'

// Conditional import based on feature flag
const getWorkspaceRouter = async () => {
  if (process.env.ENABLE_WORKSPACES === 'true') {
    const { workspaceRouter } = await import('../routers/workspace')
    return workspaceRouter
  } else {
    const { workspaceRouter } = await import('../routers/workspace/stub')
    return workspaceRouter
  }
}

export const appRouter = createTRPCRouter({
  // ... other routers
  workspace: await getWorkspaceRouter()
})
```

## Type Safety

### When Disabled

Even when the workspace feature is disabled, full type safety is maintained:

1. **Router Types**: The stub router implements the same interface as the full router
2. **Client Types**: tRPC infers types correctly, showing procedures exist but throw errors
3. **UI Components**: Can check feature flag to conditionally render workspace UI

### Type Definitions

```typescript
// types/workspace.ts
export interface Workspace {
  id: string
  name: string
  ownerId: string
  createdAt: Date
  updatedAt: Date
}

export interface WorkspaceMembership {
  id: string
  userId: string
  workspaceId: string
  role: 'owner' | 'admin' | 'member'
  joinedAt: Date
}
```

## Frontend Integration

### Conditional UI Rendering

```tsx
// app/components/features/settings/WorkspaceSettings.tsx
import { config } from '@/config'

export function WorkspaceSettings() {
  if (!config.ENABLE_WORKSPACES) {
    return null
  }
  
  // Render workspace settings UI
  return (
    <View>
      {/* Workspace management UI */}
    </View>
  )
}
```

### API Usage

```tsx
// When using workspace APIs
const { data, error } = api.workspace.getAll.useQuery(undefined, {
  enabled: config.ENABLE_WORKSPACES,
  retry: false
})

if (!config.ENABLE_WORKSPACES) {
  // Handle disabled state
  return <Text>Workspaces are not enabled</Text>
}
```

## Benefits

1. **Clean Architecture**: Feature can be completely removed without breaking the app
2. **Type Safety**: No runtime type errors when feature is disabled
3. **Developer Experience**: Clear error messages when accessing disabled features
4. **Performance**: No workspace-related code is loaded when disabled
5. **Testing**: Easy to test both enabled and disabled states

## Best Practices

1. Always check `config.ENABLE_WORKSPACES` before rendering workspace UI
2. Use the `enabled` option in React Query hooks to prevent unnecessary API calls
3. Handle the "feature disabled" error gracefully in the UI
4. Keep workspace logic isolated in dedicated modules
5. Document workspace-dependent features clearly