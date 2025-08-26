/**
 * Push Token Management Service
 * Business logic for managing push notification tokens
 */

import { ObjectId } from 'mongodb';
import { getUserCollection } from '@/config/mongodb';
import { createLogger } from '@/utils/logging/logger';

const logger = createLogger('PushTokenService');

interface PushTokenData {
  token: string;
  deviceId: string;
  platform: 'ios' | 'android';
}

/**
 * Register or update a push token for a device
 */
export async function registerPushToken(
  userId: string,
  tokenData: PushTokenData
): Promise<{ success: boolean; deviceCount: number }> {
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
      token: tokenData.token,
      deviceId: tokenData.deviceId,
      platform: tokenData.platform,
      updatedAt: new Date(),
    }
  ];
  
  // Update user document
  await users.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { pushTokens: updatedTokens } }
  );
  
  logger.info('Registered push token', { 
    userId, 
    deviceId: tokenData.deviceId,
    platform: tokenData.platform 
  });
  
  return { success: true, deviceCount: updatedTokens.length };
}