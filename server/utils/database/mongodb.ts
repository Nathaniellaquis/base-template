import { ObjectId, WithId, Document } from 'mongodb';
import { z } from 'zod';
import type { User } from '@shared';
import { 
  zodObjectIdString, 
  isValidObjectId
} from '@shared/mongodb-validation';

// Re-export validation utilities
export { isValidObjectId };

/**
 * Safely convert a string to ObjectId or return null
 */
export function toObjectIdOrNull(id: string): ObjectId | null {
  try {
    return isValidObjectId(id) ? new ObjectId(id) : null;
  } catch {
    return null;
  }
}

// Alias for backward compatibility
export const toObjectId = toObjectIdOrNull;

/**
 * Safely convert a string to ObjectId, throwing an error if invalid
 */
export function toObjectIdOrThrow(value: string, fieldName = 'id'): ObjectId {
  if (!isValidObjectId(value)) {
    throw new Error(`Invalid ${fieldName}: must be a valid ObjectId`);
  }
  return new ObjectId(value);
}

/**
 * Zod schema for validating MongoDB ObjectId strings
 * Re-export from centralized validation
 */
export const zodObjectId = zodObjectIdString;

/**
 * Create a Zod schema for a specific ObjectId field with custom error message
 * @param fieldName - The name of the field for error messages
 * @returns Zod schema for ObjectId validation
 */
export function createObjectIdSchema(fieldName: string) {
  return z.string().refine(
    (value) => isValidObjectId(value),
    {
      message: `Invalid ${fieldName}: must be a valid MongoDB ObjectId (24-character hex string)`,
    }
  );
}

/**
 * Convert a MongoDB document to a User object with string _id
 * @param doc - The MongoDB document with ObjectId
 * @returns User object with string _id
 */
export function mongoDocToUser(doc: WithId<Document>): User {
  return {
    ...doc,
    _id: doc._id.toString(), // Convert ObjectId to string
  } as User;
}

/**
 * Convert multiple MongoDB documents to User objects
 * @param docs - Array of MongoDB documents
 * @returns Array of User objects with string _id
 */
export function mongoDocsToUsers(docs: WithId<Document>[]): User[] {
  return docs.map(mongoDocToUser);
}