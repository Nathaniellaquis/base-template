# Router & Service Reorganization Plan

## Overview
Reorganize the backend structure to have consistent router directories and proper separation of business logic into services.

## Current Issues
1. Inconsistent router structure (some are single files, others are directories)
2. Business logic mixed with routing logic
3. No service layer for admin, notifications, and experiments

## Target Architecture

### Router Layer (HTTP/tRPC handlers only)
```
/server/routers/
  admin/
    index.ts           # Combines all admin routes
    users.ts           # Routes: list users, update role, delete user
    system.ts          # Routes: get stats, health check
    notifications.ts   # Routes: send notification, list all notifications
    experiments.ts     # Routes: manage experiments (admin view)
    
  notifications/
    index.ts           # Combines all notification routes
    list.ts            # Route: GET /notifications
    mark-read.ts       # Route: PUT /notifications/:id/read
    mark-all-read.ts   # Route: PUT /notifications/read-all
    delete.ts          # Route: DELETE /notifications/:id
    
  experiments/
    index.ts           # Already exists, needs updating
    create.ts          # Route: POST /experiments (rename from create-experiment.ts)
    get.ts             # Route: GET /experiments/:key
    list.ts            # Route: GET /experiments
    update.ts          # Route: PUT /experiments/:key
    update-status.ts   # Route: PUT /experiments/:key/status
    metrics.ts         # Route: GET /experiments/:key/metrics
```

### Service Layer (Business logic)
```
/server/services/
  admin/
    index.ts
    user-management.ts    # adminListUsers, changeUserRole, deleteUser
    system-stats.ts       # getSystemStats, getDatabaseStats
    notification-management.ts  # sendAdminNotification, broadcastNotification
    
  notifications/
    index.ts
    crud.ts              # createNotification, getNotifications, deleteNotification
    mark-read.ts         # markAsRead, markAllAsRead
    push.ts              # sendPushNotification (if needed)
    
  experiments/
    index.ts
    crud.ts              # createExperiment, updateExperiment, deleteExperiment
    metrics.ts           # trackExposure, trackConversion, getMetrics
    evaluation.ts        # evaluateExperiment, getVariant
    
  onboarding/
    index.ts
    progress.ts          # updateProgress, getProgress
    completion.ts        # completeStep, completeOnboarding
```

## Implementation Pattern

### Router Pattern
```typescript
// /server/routers/notifications/mark-read.ts
import { router, protectedProcedure } from '@/trpc';
import { z } from 'zod';
import { markAsRead } from '@/services/notifications';

export const markAsReadRouter = router({
  markAsRead: protectedProcedure
    .input(z.object({ 
      notificationId: z.string() 
    }))
    .mutation(async ({ input, ctx }) => {
      return await markAsRead(
        ctx.user.uid,
        input.notificationId
      );
    }),
});
```

### Service Pattern
```typescript
// /server/services/notifications/mark-read.ts
import { getNotificationsCollection } from '@/db';
import { ObjectId } from 'mongodb';
import type { Notification } from '@shared';

export async function markAsRead(
  userId: string, 
  notificationId: string
): Promise<Notification> {
  const collection = getNotificationsCollection();
  
  const result = await collection.findOneAndUpdate(
    { 
      _id: new ObjectId(notificationId),
      userId 
    },
    { 
      $set: { 
        status: 'read',
        readAt: new Date() 
      } 
    },
    { returnDocument: 'after' }
  );
  
  if (!result) {
    throw new Error('Notification not found');
  }
  
  return result as Notification;
}

export async function markAllAsRead(userId: string): Promise<number> {
  const collection = getNotificationsCollection();
  
  const result = await collection.updateMany(
    { userId, status: 'unread' },
    { 
      $set: { 
        status: 'read',
        readAt: new Date() 
      } 
    }
  );
  
  return result.modifiedCount;
}
```

## Migration Steps

### Phase 1: Create Service Structure
1. Create service directories for admin, notifications, experiments, onboarding
2. Create index.ts files for each service module
3. Create service files with empty exports

### Phase 2: Extract Business Logic
1. **Notifications**: Extract logic from notifications.ts router
2. **Admin**: Extract logic from admin.ts router
3. **Experiments**: Extract logic from experiments/ routers
4. **Onboarding**: Extract logic from onboarding/index.ts

### Phase 3: Restructure Routers
1. Create router directories for admin and notifications
2. Split single-file routers into multiple files
3. Update router imports to use services
4. Clean up old router files

### Phase 4: Update Imports
1. Update app router to import from new locations
2. Update any webhook handlers that use these services
3. Test all endpoints

## Benefits
1. **Separation of Concerns**: Routers handle HTTP/tRPC, services handle business logic
2. **Reusability**: Services can be used by webhooks, background jobs, other services
3. **Testability**: Services are pure functions, easier to unit test
4. **Consistency**: All features follow the same pattern
5. **Maintainability**: Clear structure makes it easy to find and modify code

## Success Criteria
- [ ] All routers follow directory structure
- [ ] All business logic moved to services
- [ ] No database queries in routers
- [ ] All imports updated and working
- [ ] All endpoints tested and functional