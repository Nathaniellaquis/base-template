# Admin System

## Overview
A role-based admin system that allows authorized users to access admin features like sending test notifications, viewing system data, and managing users.

## Architecture Decision: AdminProvider for Consistency

### Option 1: Simple Role Check ❌
```typescript
// Just use existing auth context
const { user } = useAuth();
if (user?.role !== 'admin') return <Unauthorized />;
```
**Why not**: Breaks the established provider pattern

### Option 2: AdminProvider (React Context) ✅
```typescript
<AdminProvider>
  <AdminPanel />
</AdminProvider>
```
**Why**: Consistent with AuthProvider, OnboardingProvider, ThemeProvider pattern!

## Implementation Details

### 1. Backend: Admin Procedures

#### Create Admin Middleware
```typescript
// server/trpc/trpc.ts (add to existing)
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }
  return next({ ctx });
});
```

#### Admin Router
```typescript
// server/routers/admin.ts
export const adminRouter = router({
  // Notification Management
  sendTestNotification: adminProcedure
    .input(z.object({
      userId: z.string(),
      title: z.string(),
      body: z.string(),
      category: z.enum(['updates', 'reminders', 'social']),
    }))
    .mutation(async ({ input }) => {
      // Use existing sendToUser
    }),
  
  // View all notifications (with pagination)
  getAllNotifications: adminProcedure
    .input(z.object({
      limit: z.number().default(50),
      skip: z.number().default(0),
    }))
    .query(async ({ input }) => {
      // Return all notifications, not just user's
    }),
  
  // User Management
  getAllUsers: adminProcedure
    .input(z.object({
      limit: z.number().default(50),
      skip: z.number().default(0),
    }))
    .query(async ({ input }) => {
      // Return user list
    }),
  
  promoteToAdmin: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      // Update user role to admin
    }),
  
  revokeAdmin: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      // Update user role to user
    }),
  
  // Stats
  getStats: adminProcedure
    .query(async () => {
      return {
        totalUsers: await users.countDocuments(),
        totalNotifications: await notifications.countDocuments(),
        notificationsSentToday: // count today's
        activeUsers: // users logged in last 7 days
      };
    }),
});
```

### 2. Frontend: AdminProvider (Following Pattern)

#### AdminProvider
```typescript
// app/providers/admin-provider.tsx
import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './auth-provider';
import { trpc } from '@/providers/trpc-provider';

interface AdminContextType {
  isAdmin: boolean;
  isLoading: boolean;
  stats?: {
    totalUsers: number;
    totalNotifications: number;
    activeUsers: number;
  };
  checkAdmin: () => boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  // Get admin stats if user is admin
  const { data: stats, isLoading } = trpc.admin.getStats.useQuery(
    undefined,
    { enabled: user?.role === 'admin' }
  );
  
  const value = useMemo(() => ({
    isAdmin: user?.role === 'admin',
    isLoading,
    stats,
    checkAdmin: () => {
      if (user?.role !== 'admin') {
        Alert.alert('Unauthorized', 'Admin access required');
        return false;
      }
      return true;
    },
  }), [user, stats, isLoading]);
  
  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
}
```

#### Protected Admin Route
```typescript
// app/app/(admin)/_layout.tsx
export default function AdminLayout() {
  const { isAdmin } = useAdmin();
  
  if (!isAdmin) {
    return <Redirect href="/(tabs)/home" />;
  }
  
  return <Stack />;
}
```

#### Add to Root Layout
```typescript
// app/app/_layout.tsx
<ThemeProvider>
  <TRPCProvider>
    <AuthProvider>
      <OnboardingProvider>
        <AdminProvider>  {/* Add here */}
          <RootNavigator />
        </AdminProvider>
      </OnboardingProvider>
    </AuthProvider>
  </TRPCProvider>
</ThemeProvider>
```

### 3. Admin UI Structure

```
app/
  (admin)/
    _layout.tsx          # Admin protection
    index.tsx           # Admin dashboard
    notifications.tsx   # Send test notifications
    users.tsx          # User management
    stats.tsx          # System statistics
```

### 4. Admin Dashboard Features

#### Main Dashboard
```typescript
// app/(admin)/index.tsx
- Quick Stats Cards
  - Total Users
  - Notifications Sent Today
  - Active Users (7 days)
- Quick Actions
  - Send Test Notification
  - View Recent Activity
```

#### Notification Testing
```typescript
// app/(admin)/notifications.tsx
- Form to send test notification
  - User selector (dropdown)
  - Title/Body inputs
  - Category selector
  - Send button
- Recent notifications table
  - User, Title, Status, Time
  - Click to view details
```

#### User Management
```typescript
// app/(admin)/users.tsx
- User list with search
- For each user:
  - Email, Display Name, Role
  - Make Admin / Revoke Admin button
  - Send Test Notification button
```

### 5. How to Make Someone Admin

#### Option A: Database Seed (Recommended)
```javascript
// MongoDB console
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

#### Option B: Environment Variable
```typescript
// During user creation
if (ADMIN_EMAILS.includes(email)) {
  user.role = 'admin';
}
```

#### Option C: First User is Admin
```typescript
// In create-user.ts
const userCount = await users.countDocuments();
if (userCount === 0) {
  newUser.role = 'admin'; // First user is admin
}
```

### 6. Security Considerations

1. **No Separate Auth System**: Use existing auth, just check role
2. **Server-Side Protection**: All admin checks on backend
3. **Audit Log**: Consider logging admin actions
4. **Rate Limiting**: Prevent spam from admin panel
5. **Environment Check**: Maybe disable in production?

### 7. Implementation Steps

1. **Add admin procedure to TRPC** (5 min)
2. **Create admin router** (20 min)
3. **Add to main app router** (2 min)
4. **Create useAdminAuth hook** (5 min)
5. **Setup admin routes** (10 min)
6. **Build admin dashboard** (30 min)
7. **Test with a promoted user** (10 min)

### 8. Testing the Admin System

1. **Make yourself admin**:
   ```javascript
   // In MongoDB
   db.users.updateOne(
     { email: "your@email.com" },
     { $set: { role: "admin" } }
   )
   ```

2. **Access admin panel**:
   - Navigate to `/admin` in app
   - Should see dashboard

3. **Test features**:
   - Send test notification to yourself
   - View all notifications
   - Promote another test user

### 9. Why This Approach?

**What we're NOT doing**:
- ❌ Separate admin authentication
- ❌ Complex permission system  
- ❌ Separate admin database
- ❌ Breaking established patterns

**What we ARE doing**:
- ✅ Following the provider pattern (consistency!)
- ✅ Simple role field on user
- ✅ Reuse existing auth
- ✅ AdminProvider like other providers
- ✅ useAdmin hook like useAuth, useTheme, useOnboarding

### 10. Future Enhancements

- **Granular Permissions**: `permissions: ['send_notifications', 'manage_users']`
- **Super Admin**: Only super admins can promote others
- **Activity Log**: Track all admin actions
- **Two-Factor**: Require 2FA for admin actions

## Summary

This is just a **role check**, not a new auth system. We're adding:
1. `role` field (already exists!)
2. `adminProcedure` middleware
3. `AdminProvider` (for consistency with other providers)
4. `useAdmin` hook (matching useAuth, useTheme pattern)
5. Simple admin UI pages

The AdminProvider gives us:
- Consistent pattern with rest of codebase
- Central place for admin-related state
- Auto-fetching admin stats
- Clean separation of concerns

Total code: ~300 lines. Consistent, clean, follows patterns.