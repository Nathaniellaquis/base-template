/**
 * Admin Notification Service
 * Business logic for admin notification operations
 */

import { createNotification, getNotifications } from '../notifications/crud';
import type { AdminNotification } from '@shared';

/**
 * Send test notification to any user (admin only)
 */
export async function sendTestNotification(
  userId: string,
  notification: {
    title: string;
    body: string;
    category: 'updates' | 'reminders' | 'social';
  }
): Promise<{ sent: boolean; notificationId?: string; reason?: string }> {
  return createNotification(userId, {
    ...notification,
    data: { sentByAdmin: true }
  });
}

/**
 * Get all notifications with user info (admin only)
 */
export async function getAllNotifications(
  limit: number = 50,
  skip: number = 0
): Promise<{ notifications: AdminNotification[]; total: number }> {
  const { getUserCollection, getNotificationsCollection } = await import('@/db');
  const notifications = getNotificationsCollection();
  const users = getUserCollection();
  
  const notificationsList = await notifications
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .toArray();
  
  // Enrich with user info
  const enrichedNotifications = await Promise.all(
    notificationsList.map(async (notif) => {
      const user = await users.findOne({ _id: notif.userId });
      return {
        _id: notif._id.toString(),
        userId: notif.userId.toString(),
        title: notif.title,
        body: notif.body,
        category: notif.category,
        status: notif.status,
        data: notif.data,
        createdAt: notif.createdAt,
        sentAt: notif.sentAt,
        deliveredAt: notif.deliveredAt,
        readAt: notif.readAt,
        platforms: notif.platforms,
        userEmail: user?.email || 'Unknown',
        userName: user?.displayName || 'Unknown',
      };
    })
  );
  
  const total = await notifications.countDocuments();
  
  return { notifications: enrichedNotifications, total };
}