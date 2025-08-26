/**
 * Admin Notifications Router
 * Handles admin operations related to notifications
 */

import { router, adminProcedure } from '@/trpc/trpc';
import { 
  sendTestNotificationSchema,
  getAllNotificationsSchema,
  sendNotificationSchema
} from '@shared';
import {
  sendTestNotification,
  getAllNotifications
} from '@/services/admin/notifications';

export const adminNotificationsRouter = router({
  // Send test notification to any user
  sendTestNotification: adminProcedure
    .input(sendTestNotificationSchema)
    .mutation(async ({ ctx, input }) => {
      return sendTestNotification(input.userId, {
        title: input.title,
        body: input.body,
        category: input.category
      });
    }),
  
  // Get all notifications (with pagination)
  getAllNotifications: adminProcedure
    .input(getAllNotificationsSchema)
    .query(async ({ ctx, input }) => {
      return getAllNotifications(input.limit, input.skip);
    }),
});