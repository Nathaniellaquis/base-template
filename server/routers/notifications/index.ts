/**
 * Notifications Router
 * Combines all notification sub-routers
 */

import { router } from '@/trpc/trpc';
import { notificationTokensRouter } from './tokens';
import { notificationPreferencesRouter } from './preferences';
import { notificationCrudRouter } from './crud';

export const notificationsRouter = router({
  // Token management
  registerToken: notificationTokensRouter.registerToken,
  
  // Preferences
  updatePreferences: notificationPreferencesRouter.updatePreferences,
  
  // CRUD operations
  sendToUser: notificationCrudRouter.sendToUser,
  markAsRead: notificationCrudRouter.markAsRead,
  getNotifications: notificationCrudRouter.getNotifications,
  markAllAsRead: notificationCrudRouter.markAllAsRead,
  delete: notificationCrudRouter.delete,
  getUnreadCount: notificationCrudRouter.getUnreadCount,
});