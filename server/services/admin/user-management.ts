/**
 * Admin User Management Service
 * Business logic for admin user operations
 */

import { ObjectId } from 'mongodb';
import { getUserCollection } from '@/config/mongodb';
import { toObjectIdOrThrow, mongoDocsToUsers, mongoDocToUser } from '@/utils/database/mongodb';
import { createLogger } from '@/utils/logging/logger';
import type { User } from '@shared';

const logger = createLogger('AdminUserService');

/**
 * Get all users with search and pagination
 */
export async function getAllUsers(options: {
  search?: string;
  limit?: number;
  skip?: number;
} = {}): Promise<{ users: User[]; total: number }> {
  const users = getUserCollection();
  const { search, limit = 50, skip = 0 } = options;
  
  // Build search query
  const query = search 
    ? {
        $or: [
          { email: { $regex: search, $options: 'i' } },
          { displayName: { $regex: search, $options: 'i' } },
        ]
      }
    : {};
  
  const [usersList, total] = await Promise.all([
    users
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .toArray(),
    users.countDocuments(query)
  ]);
  
  return { users: mongoDocsToUsers(usersList), total };
}

/**
 * Update user role
 */
export async function updateUserRole(
  adminId: string,
  userId: string,
  newRole: 'user' | 'admin'
): Promise<{ success: boolean; role: string }> {
  const users = getUserCollection();
  
  // Prevent self-demotion
  if (userId === adminId && newRole === 'user') {
    throw new Error('Cannot demote yourself');
  }
  
  const targetUserId = toObjectIdOrThrow(userId, 'userId');
  const result = await users.updateOne(
    { _id: targetUserId },
    { $set: { role: newRole } }
  );
  
  if (result.matchedCount === 0) {
    throw new Error('User not found');
  }
  
  logger.info('User role updated', { 
    adminId, 
    userId, 
    newRole 
  });
  
  return { success: true, role: newRole };
}

/**
 * Delete a user (soft delete by marking as deleted)
 */
export async function deleteUser(
  adminId: string,
  userId: string
): Promise<{ success: boolean }> {
  const users = getUserCollection();
  
  // Prevent self-deletion
  if (userId === adminId) {
    throw new Error('Cannot delete yourself');
  }
  
  const targetUserId = toObjectIdOrThrow(userId, 'userId');
  
  // Soft delete - mark as deleted instead of removing
  const result = await users.updateOne(
    { _id: targetUserId },
    { 
      $set: { 
        deletedAt: new Date(),
        deletedBy: new ObjectId(adminId)
      } 
    }
  );
  
  if (result.matchedCount === 0) {
    throw new Error('User not found');
  }
  
  logger.info('User deleted', { 
    adminId, 
    userId 
  });
  
  return { success: true };
}

/**
 * Get user details with additional admin info
 */
export async function getUserDetails(userId: string): Promise<User & {
  notificationCount: number;
  lastActivity?: Date;
}> {
  const users = getUserCollection();
  const { getNotificationsCollection } = await import('@/db');
  const notifications = getNotificationsCollection();
  
  const targetUserId = toObjectIdOrThrow(userId, 'userId');
  const user = await users.findOne({ _id: targetUserId });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Get additional info
  const notificationCount = await notifications.countDocuments({ 
    userId: targetUserId 
  });
  
  return {
    ...mongoDocToUser(user),
    notificationCount,
    lastActivity: user.updatedAt
  };
}