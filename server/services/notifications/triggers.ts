/**
 * Notification Triggers
 * 
 * TODO: Implement your notification triggers here
 * This file is where you should add functions that send notifications
 * based on your application's business logic.
 * 
 * Examples of triggers you might implement:
 * - User onboarding notifications
 * - Daily/weekly reminders
 * - Social interactions (likes, comments, follows)
 * - Payment/subscription events
 * - Achievement unlocks
 * - System maintenance notifications
 */

import { createNotification } from './crud';
import { logger } from '@/utils/logging';

/**
 * Example: Send welcome notification to new users
 * TODO: Implement based on your onboarding flow
 */
export async function sendWelcomeNotification(userId: string, userName?: string) {
  // TODO: Implement welcome notification
  logger.info('TODO: Implement sendWelcomeNotification', { userId });
  
  // Example implementation:
  /*
  await createNotification({
    recipientId: userId,
    type: 'system',
    category: 'updates',
    title: 'Welcome to the app!',
    body: `Hi ${userName || 'there'}, thanks for joining us!`,
    data: { screen: 'onboarding' }
  });
  */
}

/**
 * Example: Send notification when user receives a message
 * TODO: Implement based on your messaging system
 */
export async function sendMessageNotification(
  recipientId: string, 
  senderName: string, 
  messagePreview: string
) {
  // TODO: Implement message notification
  logger.info('TODO: Implement sendMessageNotification', { recipientId });
  
  // Example implementation:
  /*
  const user = await getUserById(recipientId);
  if (!user.notificationPreferences?.social) return;
  
  await createNotification({
    recipientId,
    type: 'message',
    category: 'social',
    title: `New message from ${senderName}`,
    body: messagePreview,
    data: { screen: 'messages' }
  });
  */
}

/**
 * Example: Send daily reminder notification
 * TODO: Implement based on your reminder logic
 */
export async function sendDailyReminder(userId: string, reminderText: string) {
  // TODO: Implement daily reminder
  logger.info('TODO: Implement sendDailyReminder', { userId });
  
  // Example implementation:
  /*
  const user = await getUserById(userId);
  if (!user.notificationPreferences?.reminders) return;
  
  await createNotification({
    recipientId: userId,
    type: 'reminder',
    category: 'reminders',
    title: 'Daily Reminder',
    body: reminderText,
    data: { screen: 'home' }
  });
  */
}

/**
 * Example: Send app update notification
 * TODO: Implement for app updates/announcements
 */
export async function sendUpdateNotification(
  userIds: string[], 
  updateTitle: string, 
  updateBody: string
) {
  // TODO: Implement update notification
  logger.info('TODO: Implement sendUpdateNotification', { userCount: userIds.length });
  
  // Example implementation:
  /*
  for (const userId of userIds) {
    const user = await getUserById(userId);
    if (!user.notificationPreferences?.updates) continue;
    
    await createNotification({
      recipientId: userId,
      type: 'announcement',
      category: 'updates',
      title: updateTitle,
      body: updateBody,
      data: { screen: 'updates' }
    });
  }
  */
}