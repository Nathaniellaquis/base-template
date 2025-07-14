/**
 * User type - simple and clean
 */
export interface User {
  // IDs
  uid: string;         // Firebase ID
  _id?: string;        // MongoDB ID

  // Basic info
  email: string;
  displayName?: string;
  emailVerified?: boolean;

  // App fields
  role?: 'user' | 'admin';
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * MongoDB user document
 */
export interface UserDocument extends User {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Firebase custom claims
 */
export interface CustomClaims {
  mongoId: string;
}

/**
 * Simple error type
 */
export interface AppError {
  message: string;
  code?: string;
}

// ======= Zod Schemas for Validation =======
import { z } from 'zod';

/**
 * Schema for creating a new user
 */
export const createUserSchema = z.object({
  displayName: z.string().min(1).max(50),
});

/**
 * Schema for updating user profile
 */
export const updateUserSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
});