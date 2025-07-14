# Shared Types

This folder contains TypeScript types shared between frontend and backend.

## Structure

```
types/
├── user.ts    # User type
├── auth.ts    # Auth request/response types  
└── index.ts   # Main export
```

## Philosophy

- **Minimal by default** - Only add types when you need them
- **No premature abstraction** - Don't create base types until patterns emerge
- **Start simple** - A few interfaces are better than a complex type system

## Usage

### Frontend
```typescript
import { User, LoginRequest, AuthResponse } from '../types';
```

### Backend  
```typescript
import { User, RegisterRequest, AuthResponse } from '@shared';
```

## When to Add Types

Only add new types when you:
1. Use the same shape in 2+ places
2. Need to ensure consistency between frontend/backend
3. Actually have the feature implemented

Don't add types for future features or "just in case".