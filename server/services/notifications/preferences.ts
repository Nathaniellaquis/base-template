/**
 * Notification Preferences Service
 */

import { ObjectId } from 'mongodb';
import { getUserCollection } from '@/config/mongodb';
import { logger } from '@/utils/logging';

/**
 * Update notification preferences for a user
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: {
    enabled?: boolean;
    updates?: boolean;
    reminders?: boolean;
    social?: boolean;
  }
): Promise<{ success: boolean }> {
  const usersCollection = getUserCollection();
  
  await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    { 
      $set: { 
        notificationPreferences: {
          enabled: preferences.enabled ?? true,
          updates: preferences.updates ?? true,
          reminders: preferences.reminders ?? true,
          social: preferences.social ?? true
        },
        updatedAt: new Date()
      } 
    }
  );
  
  logger.info('Updated notification preferences', { userId });
  
  return { success: true };
}