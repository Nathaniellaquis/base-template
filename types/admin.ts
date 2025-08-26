import { z } from 'zod';
import { zodObjectIdString as zodObjectId } from './mongodb-validation';

// ======= Zod Schemas for Admin Operations =======

/**
 * Schema for sending test notification
 */
export const sendTestNotificationSchema = z.object({
  userId: zodObjectId,
  title: z.string(),
  body: z.string(),
  category: z.enum(['updates', 'reminders', 'social']),
});

/**
 * Schema for getting all notifications
 */
export const getAllNotificationsSchema = z.object({
  limit: z.number().default(50),
  skip: z.number().default(0),
});

/**
 * Schema for getting all users
 */
export const getAllUsersSchema = z.object({
  limit: z.number().default(50),
  skip: z.number().default(0),
  search: z.string().optional(),
});

/**
 * Schema for promoting/revoking admin
 */
export const updateUserRoleSchema = z.object({
  userId: zodObjectId,
  role: z.enum(['user', 'admin']),
});

/**
 * Admin stats type
 */
export interface AdminStats {
  totalUsers: number;
  totalNotifications: number;
  notificationsSentToday: number;
  activeUsers: number;
}