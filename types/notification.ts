/**
 * Notification Types
 * Consolidated notification types for client, server, and MongoDB
 */

import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { zodObjectIdString as zodObjectId } from './mongodb-validation';

// ======= Shared Types (Client/Server) =======

/**
 * Notification categories
 */
export type NotificationCategory = 'updates' | 'reminders' | 'social';

/**
 * Notification type for API responses
 */
export interface Notification {
  _id: string;
  userId: string;
  title: string;
  body: string;
  category: 'updates' | 'reminders' | 'social';
  status: 'created' | 'sent' | 'delivered' | 'read' | 'failed';
  data?: Record<string, unknown>;
  createdAt: Date | string;
  sentAt?: Date | string;
  deliveredAt?: Date | string;
  readAt?: Date | string;
  platforms?: ('ios' | 'android')[];
  userEmail?: string; // For admin view
}

/**
 * Notification list response
 */
export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
}

/**
 * Admin notification with user info
 */
export interface AdminNotification extends Notification {
  userEmail: string;
  userName?: string;
}

// ======= MongoDB Types =======

/**
 * Notification document for tracking & history
 */
export interface NotificationDocument {
  _id: ObjectId;
  userId: ObjectId;
  
  // Content
  title: string;
  body: string;
  category: 'updates' | 'reminders' | 'social';
  data?: any; // For deep linking
  
  // Status tracking
  status: 'created' | 'sent' | 'delivered' | 'read' | 'failed';
  createdAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  
  // Platform info
  platforms: ('ios' | 'android')[];
  
  // Expo response (for debugging)
  pushTickets?: any[];
}

// ======= Zod Schemas for Validation =======

/**
 * Schema for registering a push token
 */
export const registerTokenSchema = z.object({
  token: z.string(),
  deviceId: z.string(),
  platform: z.enum(['ios', 'android']),
});

/**
 * Schema for updating notification preferences
 */
export const updatePreferencesSchema = z.object({
  enabled: z.boolean(),
  updates: z.boolean().optional(),
  reminders: z.boolean().optional(),
  social: z.boolean().optional(),
});

/**
 * Schema for sending notification to user
 */
export const sendNotificationSchema = z.object({
  userId: zodObjectId,
  title: z.string(),
  body: z.string(),
  category: z.enum(['updates', 'reminders', 'social']),
  data: z.any().optional(),
});

/**
 * Schema for marking notification as read
 */
export const markAsReadSchema = z.object({
  notificationId: zodObjectId,
});

/**
 * Schema for getting notifications
 */
export const getNotificationsSchema = z.object({
  limit: z.number().default(20),
  skip: z.number().default(0),
  unreadOnly: z.boolean().default(false),
});

/**
 * Schema for marking all notifications as read
 */
export const markAllAsReadSchema = z.object({
  category: z.enum(['updates', 'reminders', 'social']).optional(),
});

/**
 * Schema for deleting a notification
 */
export const deleteNotificationSchema = z.object({
  notificationId: zodObjectId,
});

/**
 * Response for unread count
 */
export interface UnreadCountResponse {
  total: number;
  byCategory: {
    updates: number;
    reminders: number;
    social: number;
  };
}