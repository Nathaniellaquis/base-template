/**
 * Calculate Profile Completeness
 * Business logic for calculating user profile completion percentage
 */

import type { User } from '@shared';

/**
 * Calculate profile completeness percentage
 */
export function calculateProfileCompleteness(user: User): number {
  const fields = [
    user.displayName,
    user.bio,
    user.phoneNumber,
    user.location,
    user.timezone,
    user.website,
    user.socialLinks?.twitter || 
    user.socialLinks?.linkedin || 
    user.socialLinks?.github || 
    user.socialLinks?.instagram
  ];
  
  const completedFields = fields.filter(field => !!field).length;
  const totalFields = fields.length;
  
  return Math.round((completedFields / totalFields) * 100);
}