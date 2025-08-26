/**
 * Notifications CRUD Router
 * Handles notification creation, reading, updating, and deletion
 */

import { router, protectedProcedure } from '@/trpc/trpc';
import { 
  sendNotificationSchema,
  markAsReadSchema,
  getNotificationsSchema,
  markAllAsReadSchema,
  deleteNotificationSchema,
  type UnreadCountResponse
} from '@shared';
import {
  createNotification,
  getNotifications,
  deleteNotification,
  getUnreadCount
} from '@/services/notifications/crud';

export const notificationCrudRouter = router({
  // Send notification to user
  sendToUser: protectedProcedure
    .input(sendNotificationSchema)
    .mutation(async ({ ctx, input }) => {
      return createNotification(input.userId, {
        title: input.title,
        body: input.body,
        category: input.category,
        data: input.data
      });
    }),
  
  // Mark notification as read
  markAsRead: protectedProcedure
    .input(markAsReadSchema)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const { markAsRead } = await import('@/services/notifications/mark-read');
      return markAsRead(user._id!, input.notificationId);
    }),
  
  // Get user's notifications
  getNotifications: protectedProcedure
    .input(getNotificationsSchema)
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      return getNotifications(user._id!, {
        limit: input.limit,
        skip: input.skip,
        unreadOnly: input.unreadOnly
      });
    }),
  
  // Mark all notifications as read
  markAllAsRead: protectedProcedure
    .input(markAllAsReadSchema)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const { markAllAsRead } = await import('@/services/notifications/mark-read');
      return markAllAsRead(user._id!, input.category);
    }),
  
  // Delete a notification
  delete: protectedProcedure
    .input(deleteNotificationSchema)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      return deleteNotification(input.notificationId, user._id!);
    }),
  
  // Get unread notification count
  getUnreadCount: protectedProcedure
    .query(async ({ ctx }): Promise<UnreadCountResponse> => {
      const { user } = ctx;
      return getUnreadCount(user._id!);
    }),
});