# System Architecture Overview

## 🏗️ Project Structure

```
ingrd/
├── app/                    # React Native/Expo frontend
│   ├── app/               # Expo Router pages
│   ├── components/        # UI components
│   ├── providers/         # Context providers
│   ├── hooks/            # Custom React hooks
│   ├── styles/           # Theme system
│   └── types/            # App-specific types
├── server/                # Express/TRPC backend
│   ├── routers/          # TRPC API endpoints
│   ├── services/         # Business logic
│   ├── trpc/            # TRPC setup
│   └── firebase.ts      # Firebase Admin
├── types/                 # Shared type definitions
└── scripts/              # Build & deployment

```

## 🔐 Authentication System

### Overview
Dual-layer authentication using Firebase Auth + MongoDB user records.

### Flow
1. **User Registration**
   - Firebase creates auth user
   - Backend creates MongoDB user document
   - Custom claims set with MongoDB ID
   - User profile synced

2. **User Login**
   - Firebase handles authentication
   - Token includes custom claims
   - Backend validates token
   - MongoDB user fetched

### Key Components
- **Firebase Auth**: Identity provider
- **MongoDB Users**: Application data
- **Custom Claims**: Links Firebase UID to MongoDB ID
- **TRPC Context**: Provides authenticated user to all procedures

### Code Locations
- Frontend auth: `/app/providers/auth-provider.tsx`
- Backend auth: `/server/trpc/context.ts`
- User service: `/server/services/user/`

## 🎨 Theme System

### Architecture
- **Theme Provider**: `/app/providers/theme-provider.tsx`
- **Theme Definitions**: `/app/styles/themes.ts`
- **Type Definitions**: `/app/types/theme.ts`
- **Style Utilities**: `/app/styles/index.ts`

### Features
- Light/Dark mode support
- System preference detection
- Typed theme objects
- Component style creators
- Consistent spacing/typography

### Usage Pattern
```typescript
// Component style file
import { Theme } from '@/types/theme';

export const createStyles = (theme: Theme) => ({
  container: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  }
});

// In component
const styles = useThemedStyles(createStyles);
```

## 📱 Notification System

### Components
1. **Push Tokens**: Multi-device support via Expo
2. **Preferences**: User-controlled categories
3. **Delivery**: Server-sent via Expo Push API
4. **Tracking**: Read status and engagement

### Data Model
- Push tokens stored in user document
- Notifications in separate collection
- Preferences per user

### Code Locations
- Hook: `/app/hooks/useNotifications.ts`
- Router: `/server/routers/notifications.ts`
- Types: `/types/notifications.ts`

## 👤 Onboarding Flow

### Structure
- **Steps Config**: `/app/config/onboarding-steps.ts`
- **Provider**: `/app/providers/onboarding-provider.tsx`
- **Screens**: `/app/app/(onboarding)/`
- **Backend**: `/server/routers/onboarding/`

### Features
- Multi-step wizard
- Progress tracking
- Skip protection
- Backend validation

## 👮 Admin System

### Architecture
- Role-based access control
- Admin middleware in TRPC
- Dedicated admin screens
- Statistics dashboard

### Components
- **Provider**: `/app/providers/admin-provider.tsx`
- **Screens**: `/app/app/(admin)/`
- **Router**: `/server/routers/admin.ts`
- **Middleware**: `/server/trpc/trpc.ts`

## 🔄 Data Flow

### Client → Server
```
React Native App
    ↓
TRPC Client (with auth token)
    ↓
TRPC Server
    ↓
Context (validates token, gets user)
    ↓
Procedure (protected/admin/public)
    ↓
MongoDB Operation
```

### Server → Client
```
MongoDB Change
    ↓
TRPC Response
    ↓
React Query Cache
    ↓
Component Re-render
```

## 📦 Type System

### Organization
- **Shared Types** (`/types/`): Domain models used by both client & server
- **App Types** (`/app/types/`): Frontend-specific (Theme, UI)
- **Co-located Types**: Component-specific interfaces

### Path Aliases
- `@shared/*`: Points to `/types/*` (domain types)
- `@/*`: Points to current directory
- `@/components/*`, `@/hooks/*`, etc: Specific folders

### Best Practices
1. Use Zod schemas for validation
2. Infer types from Zod when possible
3. Co-locate component types
4. Share domain types

## 🛠️ Development Workflow

### Adding a Feature
1. Define types in `/types/` if shared
2. Create TRPC router in `/server/routers/`
3. Add provider if stateful in `/app/providers/`
4. Create hook in `/app/hooks/`
5. Build UI in `/app/components/` or `/app/app/`

### Testing Checklist
- [ ] TypeScript compiles
- [ ] Authentication works
- [ ] Permissions checked
- [ ] Error handling
- [ ] Loading states
- [ ] Mobile responsive

## 🚀 Deployment

### Environment Variables
- **Frontend**: Expo environment config
- **Backend**: `.env` file
- **Firebase**: Service account JSON
- **MongoDB**: Connection string

### Build Process
1. Backend: TypeScript → JavaScript
2. Frontend: Expo build for iOS/Android
3. Web: Next.js compatible output

## 📚 Related Documentation

- [Type Architecture](./TYPE_ARCHITECTURE.md) - Type system design
- [Notifications Plan](./NOTIFICATIONS_PLAN.md) - Push notification implementation
- [Onboarding Plan](./ONBOARDING_PLAN.md) - User onboarding flow
- [Admin Plan](./ADMIN_PLAN.md) - Admin system design

## 🔍 Quick Reference

### Common Patterns

**Protected TRPC Procedure**
```typescript
export const myProcedure = protectedProcedure
  .input(z.object({ ... }))
  .mutation(async ({ ctx, input }) => {
    const { user } = ctx; // Authenticated user
    // Your logic here
  });
```

**Using Theme in Component**
```typescript
const MyComponent = () => {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  // Component JSX
};
```

**Provider Pattern**
```typescript
const MyContext = createContext<Value | null>(null);

export function MyProvider({ children }) {
  // Provider logic
  return <MyContext.Provider value={...}>{children}</MyContext.Provider>;
}

export function useMyHook() {
  const context = useContext(MyContext);
  if (!context) throw new Error('...');
  return context;
}
```

## 🐛 Common Issues & Solutions

### Issue: User not syncing between Firebase and MongoDB
**Solution**: Check custom claims are set correctly, ensure backend creates user on first login

### Issue: TypeScript path aliases not working
**Solution**: Verify tsconfig.json paths, restart TypeScript server

### Issue: Theme not updating
**Solution**: Check ThemeProvider is wrapping app, verify useTheme hook usage

### Issue: Admin routes accessible to non-admins
**Solution**: Ensure using `adminProcedure` not `protectedProcedure`

### Issue: Push notifications not working
**Solution**: Check Expo push token registration, verify notification preferences