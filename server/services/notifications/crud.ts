/**
 * Notification CRUD Operations
 * Core business logic for creating, reading, and deleting notifications
 */

import { ObjectId } from 'mongodb';
import { getNotificationsCollection, getUserCollection } from '@/config/mongodb';
import { config } from '@/config';
import { toObjectIdOrThrow } from '@/utils/database/mongodb';
import { createLogger } from '@/utils/logging/logger';
import type { Notification, NotificationDocument, NotificationCategory } from '@shared';

const logger = createLogger('NotificationService');

/**
 * Create and send a notification to a user
 */
export async function createNotification(
  userId: string,
  notification: {
    title: string;
    body: string;
    category: NotificationCategory;
    data?: Record<string, any>;
  }
): Promise<{ sent: boolean; notificationId?: string; reason?: string }> {
  const users = getUserCollection();
  const notifications = getNotificationsCollection();
  
  // Validate and find target user
  const targetUserId = toObjectIdOrThrow(userId, 'userId');
  const targetUser = await users.findOne({ _id: targetUserId });
  
  if (!targetUser) {
    throw new Error('User not found');
  }
  
  // Check notification preferences
  if (!targetUser.notificationPreferences?.enabled) {
    return { sent: false, reason: 'Notifications disabled' };
  }
  
  if (!targetUser.notificationPreferences[notification.category]) {
    return { sent: false, reason: 'Category disabled' };
  }
  
  // Create notification record
  const notificationDoc = await notifications.insertOne({
    userId: targetUser._id,
    title: notification.title,
    body: notification.body,
    category: notification.category,
    data: notification.data,
    status: 'created' as const,
    createdAt: new Date(),
    platforms: targetUser.pushTokens?.map((t: any) => t.platform) || [],
  } as NotificationDocument);
  
  // Send push notifications if user has tokens
  const mobileTokens = targetUser.pushTokens?.map((t: any) => t.token) || [];
  
  if (mobileTokens.length > 0) {
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: mobileTokens,
          title: notification.title,
          body: notification.body,
          data: { 
            ...notification.data, 
            notificationId: notificationDoc.insertedId.toString() 
          },
        }),
      });
      
      const pushTickets = await response.json();
      
      // Update notification status
      await notifications.updateOne(
        { _id: notificationDoc.insertedId },
        { 
          $set: { 
            status: 'sent',
            sentAt: new Date(),
            pushTickets
          } 
        }
      );
      
      logger.info('Push notification sent', { 
        userId, 
        notificationId: notificationDoc.insertedId.toString(),
        deviceCount: mobileTokens.length 
      });
    } catch (error) {
      logger.error('Failed to send push notification', { error, userId });
    }
  }
  
  return { 
    sent: true, 
    notificationId: notificationDoc.insertedId.toString() 
  };
}

/**
 * Get notifications for a user
 */
export async function getNotifications(
  userId: string,
  options: {
    unreadOnly?: boolean;
    limit?: number;
    skip?: number;
  } = {}
): Promise<{ notifications: Notification[]; total: number }> {
  const notifications = getNotificationsCollection();
  const { unreadOnly = false, limit = 50, skip = 0 } = options;
  
  const query: any = { 
    userId: new ObjectId(userId) 
  };
  
  if (unreadOnly) {
    query.status = { $ne: 'read' as const };
  }
  
  const [notificationsList, total] = await Promise.all([
    notifications
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .toArray(),
    notifications.countDocuments(query)
  ]);
  
  // Transform to API format
  const transformedNotifications = notificationsList.map(transformNotification);
  
  return { notifications: transformedNotifications, total };
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  userId: string,
  notificationId: string
): Promise<void> {
  const notifications = getNotificationsCollection();
  const notifId = toObjectIdOrThrow(notificationId, 'notificationId');
  
  const result = await notifications.deleteOne({
    _id: notifId,
    userId: new ObjectId(userId)
  });
  
  if (result.deletedCount === 0) {
    throw new Error('Notification not found or access denied');
  }
  
  logger.info('Deleted notification', { notificationId, userId });
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<{
  total: number;
  byCategory: Record<NotificationCategory, number>;
}> {
  const notifications = getNotificationsCollection();
  
  const baseQuery = {
    userId: new ObjectId(userId),
    status: { $ne: 'read' as const }
  };
  
  const [total, updates, reminders, social] = await Promise.all([
    notifications.countDocuments(baseQuery),
    notifications.countDocuments({ ...baseQuery, category: 'updates' as const }),
    notifications.countDocuments({ ...baseQuery, category: 'reminders' as const }),
    notifications.countDocuments({ ...baseQuery, category: 'social' as const })
  ]);
  
  return {
    total,
    byCategory: {
      updates,
      reminders,
      social
    }
  };
}

/**
 * Transform MongoDB document to API format
 */
export function transformNotification(doc: any): Notification {
  return {
    _id: doc._id.toString(),
    userId: doc.userId.toString(),
    title: doc.title,
    body: doc.body,
    category: doc.category,
    status: doc.status,
    data: doc.data,
    createdAt: doc.createdAt,
    sentAt: doc.sentAt,
    deliveredAt: doc.deliveredAt,
    readAt: doc.readAt,
    platforms: doc.platforms
  };
}

