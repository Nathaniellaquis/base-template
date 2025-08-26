/**
 * Notification Preferences Service
 * Business logic for managing user notification preferences
 */

import { ObjectId } from 'mongodb';
import { getUserCollection } from '@/config/mongodb';
import { createLogger } from '@/utils/logging/logger';

const logger = createLogger('NotificationPreferencesService');

/**
 * Update notification preferences for a user
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: {
    enabled: boolean;
    updates?: boolean;
    reminders?: boolean;
    social?: boolean;
  }
): Promise<{ success: boolean }> {
  const users = getUserCollection();
  
  const result = await users.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { notificationPreferences: {
      enabled: preferences.enabled,
      updates: preferences.updates ?? true,
      reminders: preferences.reminders ?? true,
      social: preferences.social ?? true
    } } }
  );
  
  if (result.matchedCount === 0) {
    throw new Error('User not found');
  }
  
  logger.info('Updated notification preferences', { userId });
  
  return { success: true };
}