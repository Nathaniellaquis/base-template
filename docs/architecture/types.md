# Type Architecture Guide

## Overview
This document explains our TypeScript type architecture and the reasoning behind our organizational decisions. We follow industry best practices for type co-location and separation of concerns.

## Core Principles

### 1. Co-location Over Centralization
We co-locate types with their usage context rather than centralizing everything in a single location.

### 2. Shared vs Local Types
- **Shared types** → `/types` folder (used across client/server)
- **Local types** → Co-located with implementation (component/context specific)

## Type Organization Structure

```
ingrd/
├── types/                          # Shared domain types & validation
│   ├── user.ts                    # User domain model + Zod schemas
│   ├── admin.ts                   # Admin operations + Zod schemas
│   ├── notifications.ts           # Notification models + Zod schemas
│   ├── onboarding.ts              # Onboarding flow + Zod schemas
│   ├── notification.ts            # MongoDB document types
│   └── mongodb-validation.ts      # Centralized ObjectId validation
│
├── app/
│   ├── components/
│   │   └── ui/
│   │       ├── Button/
│   │       │   └── index.tsx      # Contains ButtonProps (local)
│   │       ├── Card/
│   │       │   └── index.tsx      # Contains CardProps (local)
│   │       └── Input/
│   │           └── index.tsx      # Contains InputProps (local)
│   │
│   └── providers/
│       ├── auth-provider.tsx      # Contains AuthContextValue (local)
│       ├── admin-provider.tsx     # Contains AdminContextValue (local)
│       └── theme-provider.tsx     # Contains ThemeContextValue (local)
│
└── server/
    ├── trpc/
    │   └── context.ts             # Contains Context type (server-only)
    └── config.ts                  # Contains Config interface (server-only)
```

## Type Categories

### 1. Domain Types (Shared)
**Location**: `/types/*.ts`

**What goes here**:
- Database models
- API contracts
- Validation schemas (Zod)
- Business logic types

**Example**:
```typescript
// types/user.ts
export interface User {
  uid: string;
  email: string;
  role?: 'user' | 'admin';
}

export const createUserSchema = z.object({
  displayName: z.string().min(1).max(50),
});
```

**Why**: These types define the core business domain and are shared between frontend and backend.

### 2. Component Props (Local)
**Location**: Co-located with component

**What goes here**:
- Component prop interfaces
- Component-specific types
- Style types

**Example**:
```typescript
// app/components/ui/Button/index.tsx
interface ButtonProps {
  title: string;
  variant?: 'primary' | 'secondary';
  onPress: () => void;
}

export function Button({ title, variant, onPress }: ButtonProps) {
  // ...
}
```

**Why**: 
- Props are tightly coupled to their component
- Changes to component often require prop changes
- No other code needs these types
- Easier to maintain when co-located

### 3. Context Types (Local)
**Location**: Co-located with provider

**What goes here**:
- Context value interfaces
- Provider-specific types

**Example**:
```typescript
// app/providers/auth-provider.tsx
interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
```

**Why**:
- Context shape is defined by the provider
- Consumers import the hook, not the type
- Keeps provider implementation details together

### 4. Server Types (Local)
**Location**: Co-located with server code

**What goes here**:
- TRPC context
- Server configuration
- Internal server types

**Example**:
```typescript
// server/trpc/context.ts
export interface Context {
  user: User | null;
  db: Db;
}
```

**Why**:
- Never imported by client code
- Part of server implementation
- May contain sensitive type information

## Benefits of This Architecture

### 1. **Maintainability**
- Related code stays together
- Changes are localized
- Less file jumping

### 2. **Discoverability**
- Developers find types where they expect them
- Component types with components
- Domain types in types folder

### 3. **No False Dependencies**
- Components can't accidentally import other component's props
- Clear boundaries between domains

### 4. **Scalability**
- New components bring their own types
- No single file becomes a dumping ground
- Teams can work independently

### 5. **Type Safety**
- Zod schemas provide runtime validation
- TypeScript provides compile-time safety
- Single source of truth for validation

## Anti-Patterns to Avoid

### ❌ **Don't: Centralize All Types**
```typescript
// Bad: Everything in types folder
/types/
  ├── ButtonProps.ts
  ├── CardProps.ts
  ├── InputProps.ts
  ├── AuthContextValue.ts
  └── user.ts
```

### ❌ **Don't: Inline Complex Types**
```typescript
// Bad: Complex type inline
.input((input: { user: { name: string; email: string } }) => {})

// Good: Use Zod schema
.input(createUserSchema)
```

### ❌ **Don't: Duplicate Types**
```typescript
// Bad: Same type defined in multiple places
// client/types.ts
interface User { name: string }
// server/types.ts  
interface User { name: string }

// Good: Single source in /types
// types/user.ts
export interface User { name: string }
```

## Migration Guide

### When to Move Types to `/types`

Move a type to the shared `/types` folder when:
1. It's used by both client and server
2. It represents a domain model
3. It needs validation (Zod schema)
4. Multiple unrelated components need it

### When to Keep Types Local

Keep types co-located when:
1. Only used by one component/provider
2. It's a component prop interface
3. It's internal to implementation
4. It would create false dependencies if shared

## Validation Strategy

### All API Inputs Use Zod
Every TRPC procedure that accepts input MUST use a Zod schema:

```typescript
// ✅ Correct
import { createUserSchema } from '@shared/user';

export const createUser = publicProcedure
  .input(createUserSchema)
  .mutation(async ({ input }) => {
    // input is validated and typed
  });

// ❌ Wrong - no validation
export const createUser = publicProcedure
  .input((input: any) => input)
  .mutation(async ({ input }) => {
    // input is not validated
  });
```

### Benefits of Zod Validation
1. **Runtime Safety**: Invalid requests rejected before processing
2. **Type Inference**: TypeScript types automatically generated
3. **Error Messages**: Clear validation errors returned to client
4. **Single Source**: One schema for both validation and types

## Best Practices

### 1. **Use Path Aliases**
```typescript
// Good
import { User } from '@shared/user';
import { Button } from '@/components/ui';

// Bad
import { User } from '../../../types/user';
```

### 2. **Export Thoughtfully**
```typescript
// types/user.ts
export interface User { }           // Export: Used elsewhere
export const userSchema = z.object(); // Export: Used for validation
interface UserInternal { }           // Don't export: Internal only
```

### 3. **Consistent Naming**
- Interfaces: `PascalCase` (User, ButtonProps)
- Schemas: `camelCase` with 'Schema' suffix (createUserSchema)
- Types: `PascalCase` (AdminStats)

### 4. **Document Complex Types**
```typescript
/**
 * Represents a user's notification preferences
 * @see NotificationDocument for the notification model
 */
export interface NotificationPreferences {
  enabled: boolean;      // Master switch
  updates: boolean;      // App updates
  reminders: boolean;    // Task reminders
  social: boolean;       // Social interactions
}
```

### 5. **Use Centralized MongoDB Validation**
```typescript
// Import from centralized location
import { zodObjectId, zodObjectIdString, isValidObjectId } from '@shared/mongodb-validation';

// Use in Zod schemas
export const getUserSchema = z.object({
  userId: zodObjectIdString, // Validates ObjectId format
});

// Use in server code
if (!isValidObjectId(userId)) {
  throw errors.badRequest('Invalid user ID');
}
```

## Examples

### Example 1: Creating a New Feature

When adding a messaging feature:

```typescript
// 1. Create domain types in /types/message.ts
export interface Message {
  id: string;
  content: string;
  userId: string;
}

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(1000),
  recipientId: z.string(),
});

// 2. Component props stay local
// app/components/MessageBubble/index.tsx
interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

// 3. Context stays with provider
// app/providers/chat-provider.tsx
interface ChatContextValue {
  messages: Message[];
  sendMessage: (content: string) => void;
}
```

### Example 2: Refactoring Existing Code

If you find types in the wrong place:

```typescript
// Before: Props in /types
// types/components.ts ❌
export interface ButtonProps { }

// After: Props with component
// components/Button/index.tsx ✅
interface ButtonProps { }
```

## Conclusion

This type architecture provides:
- **Clear organization**: Know where to find/put types
- **Maintainability**: Related code stays together
- **Scalability**: Grows naturally with the codebase
- **Type safety**: Validation at runtime and compile time

Follow these patterns for a clean, maintainable, and professional TypeScript codebase.