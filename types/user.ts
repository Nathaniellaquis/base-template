import type { Subscription } from './payment';
import type { WorkspaceMember } from './workspace';

/**
 * User type - simple and clean
 */
export interface User {
  // IDs
  uid: string;         // Firebase ID
  _id?: string;        // MongoDB ID (as string)

  // Basic info
  email: string;
  displayName?: string;
  emailVerified?: boolean;

  // App fields
  role?: 'user' | 'admin';
  onboardingCompleted?: boolean;
  onboarding?: {
    currentStep: number;
    totalSteps: number;
    startedAt: Date;
    version: number;
  };
  createdAt?: Date;
  updatedAt?: Date;

  // Profile fields
  bio?: string;
  phoneNumber?: string;
  location?: string;
  timezone?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    instagram?: string;
  };
  profileCompleteness?: number; // 0-100 percentage
  lastProfileUpdate?: Date;

  // Notification fields
  pushTokens?: {
    token: string;
    deviceId?: string;
    platform: 'ios' | 'android';
    updatedAt: Date;
  }[];

  notificationPreferences?: {
    enabled: boolean;
    updates: boolean;
    reminders: boolean;
    social: boolean;
  };

  // Workspace fields (only populated when workspaces enabled)
  currentWorkspaceId?: string;
  workspaces?: Array<{
    workspaceId: string;
    role: WorkspaceMember['role'];
    joinedAt: Date;
  }>;


  subscription?: Subscription;

  // RevenueCat fields
  revenueCatId?: string;  // RevenueCat app user ID
  revenueCatOriginalAppUserId?: string;  // Original app user ID
  lastSyncedAt?: Date;  // Last sync with RevenueCat API
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
 * Schema for creating a new user (empty - backend auto-creates from Firebase token)
 */
export const createUserSchema = z.object({});

/**
 * Schema for updating user profile
 */
export const updateUserSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  location: z.string().max(100).optional(),
  timezone: z.string().optional(),
  website: z.string().url().optional(),
  socialLinks: z.object({
    twitter: z.string().max(50).optional(),
    linkedin: z.string().max(100).optional(),
    github: z.string().max(50).optional(),
    instagram: z.string().max(50).optional(),
  }).optional(),
});

