/**
 * Notification Mark as Read Operations
 * Business logic for marking notifications as read
 */

import { ObjectId, Filter } from 'mongodb';
import { getNotificationsCollection } from '@/config/mongodb';
import { toObjectIdOrThrow } from '@/utils/database/mongodb';
import { createLogger } from '@/utils/logging/logger';
import { transformNotification } from './crud';
import type { Notification, NotificationDocument, NotificationCategory } from '@shared';

const logger = createLogger('NotificationService');

/**
 * Mark a single notification as read
 */
export async function markAsRead(
  userId: string,
  notificationId: string
): Promise<Notification> {
  const notifications = getNotificationsCollection();
  const notifId = toObjectIdOrThrow(notificationId, 'notificationId');
  
  const result = await notifications.findOneAndUpdate(
    { 
      _id: notifId,
      userId: new ObjectId(userId) // Ensure user owns this notification
    },
    { 
      $set: { 
        status: 'read' as const,
        readAt: new Date() 
      } 
    },
    { returnDocument: 'after' }
  );
  
  if (!result) {
    throw new Error('Notification not found or access denied');
  }
  
  logger.info('Marked notification as read', { notificationId, userId });
  
  return transformNotification(result);
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(
  userId: string,
  category?: NotificationCategory
): Promise<{ success: boolean; modifiedCount: number }> {
  const notifications = getNotificationsCollection();
  
  const query: any = {
    userId: new ObjectId(userId),
    status: { $ne: 'read' }
  };
  
  // Filter by category if provided
  if (category) {
    query.category = category;
  }
  
  const result = await notifications.updateMany(
    query,
    {
      $set: {
        status: 'read',
        readAt: new Date()
      }
    }
  );
  
  logger.info('Marked notifications as read', { 
    userId, 
    category,
    count: result.modifiedCount 
  });
  
  return { 
    success: true, 
    modifiedCount: result.modifiedCount 
  };
}

/**
 * Update push token for a device
 */
export async function updatePushToken(
  userId: string,
  tokenData: {
    token: string;
    deviceId: string;
    platform: 'ios' | 'android';
  }
): Promise<{ success: boolean; deviceCount: number }> {
  const { getUserCollection } = await import('@/db');
  const users = getUserCollection();
  const user = await users.findOne({ _id: new ObjectId(userId) });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Get existing tokens or initialize empty array
  const existingTokens = user.pushTokens || [];
  
  // Remove old token for this device if exists
  const filteredTokens = existingTokens.filter((t: any) => t.deviceId !== tokenData.deviceId);
  
  // Add new token
  const updatedTokens = [
    ...filteredTokens,
    {
      ...tokenData,
      updatedAt: new Date(),
    }
  ];
  
  // Update user document
  await users.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { pushTokens: updatedTokens } }
  );
  
  logger.info('Updated push token', { 
    userId, 
    deviceId: tokenData.deviceId,
    platform: tokenData.platform 
  });
  
  return { success: true, deviceCount: updatedTokens.length };
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Record<string, boolean>
): Promise<{ success: boolean }> {
  const { getUserCollection } = await import('@/db');
  const users = getUserCollection();
  
  await users.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { notificationPreferences: {
      enabled: preferences.enabled ?? true,
      updates: preferences.updates ?? true,
      reminders: preferences.reminders ?? true,
      social: preferences.social ?? true
    } } }
  );
  
  logger.info('Updated notification preferences', { userId });
  
  return { success: true };
}