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


