# Shared Types

This folder contains TypeScript types shared between frontend and backend.

## Structure

```
types/
├── index.ts              # Main barrel export for all types
│
├── Core Types
│   ├── app-config.ts     # App configuration enums
│   ├── auth.ts           # Auth request/response types
│   ├── firebase.ts       # Firebase custom token types
│   └── user.ts           # User type and schemas
│
├── Feature Types
│   ├── notification.ts   # Notification types (consolidated)
│   ├── onboarding.ts     # Onboarding document and schemas
│   ├── onboarding-config.ts # Onboarding configuration
│   ├── payment.ts        # Payment and subscription types
│   └── theme.ts          # Theme type definitions
│
├── Admin Types
│   └── admin.ts          # Admin operations and schemas
│
└── Utility Types
    └── mongodb-validation.ts # MongoDB ObjectId validation
```

## Philosophy

- **Minimal by default** - Only add types when you need them
- **No premature abstraction** - Don't create base types until patterns emerge
- **Start simple** - A few interfaces are better than a complex type system
- **Consolidated exports** - All types are exported through index.ts

## Usage

### Frontend
```typescript
import { User, LoginRequest, AuthResponse, Notification } from '../types';
```

### Backend  
```typescript
import { User, RegisterRequest, AuthResponse, NotificationDocument } from '@shared';
```

## Type Organization

### Consolidated Notification Types
The notification types have been consolidated into a single `notification.ts` file with clear sections:
- **Shared Types**: Used by both client and server (no MongoDB specifics)
- **MongoDB Types**: Server-only types with MongoDB ObjectId
- **Zod Schemas**: Validation schemas for API endpoints

### Mixed Type Files
Several files contain both TypeScript interfaces and Zod validation schemas:
- `user.ts`: User interfaces and user-related schemas
- `payment.ts`: Payment types and payment validation schemas
- `notification.ts`: Notification types and notification schemas
- `admin.ts`: Admin operations schemas and stats interface
- `onboarding.ts`: Onboarding document and progress schemas

## When to Add Types

Only add new types when you:
1. Use the same shape in 2+ places
2. Need to ensure consistency between frontend/backend
3. Actually have the feature implemented

Don't add types for future features or "just in case".