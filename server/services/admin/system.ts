/**
 * Admin System Stats Service
 * Business logic for system statistics and monitoring
 */

import { getUserCollection, getNotificationsCollection } from '@/config/mongodb';
import type { AdminStats } from '@shared';

/**
 * Get system statistics
 */
export async function getSystemStats(): Promise<AdminStats> {
  const users = getUserCollection();
  const notifications = getNotificationsCollection();
  
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const [
    totalUsers,
    totalNotifications,
    notificationsSentToday,
    activeUsers
  ] = await Promise.all([
    users.countDocuments(),
    notifications.countDocuments(),
    notifications.countDocuments({
      createdAt: { $gte: startOfDay }
    }),
    users.countDocuments({
      updatedAt: { $gte: sevenDaysAgo }
    }),
  ]);
  
  return {
    totalUsers,
    totalNotifications,
    notificationsSentToday,
    activeUsers,
  };
}