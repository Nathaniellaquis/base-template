/**
 * MongoDB Validation Utilities
 * Shared validation schemas for MongoDB ObjectIds
 */

import { z } from 'zod';

/**
 * Zod schema for validating MongoDB ObjectId strings
 */
export const zodObjectIdString = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

/**
 * Type alias for cleaner imports
 */
export type ObjectIdString = z.infer<typeof zodObjectIdString>;

/**
 * Check if a string is a valid MongoDB ObjectId
 */
export function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

