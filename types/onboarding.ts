import { ObjectId } from 'mongodb';
import { z } from 'zod';

// Onboarding configuration constants
export const TOTAL_ONBOARDING_STEPS = 4; // Welcome + Profile Setup + Value Recap + Plan Selection

export interface OnboardingDocument {
  _id?: ObjectId;
  userId: ObjectId;
  currentStep: number;
  startedAt: Date;
  completedAt?: Date;
  version: string;
}

// ======= Zod Schemas for Validation =======

/**
 * Schema for updating onboarding progress
 */
export const updateOnboardingSchema = z.object({
  action: z.enum(['complete', 'navigate']),
});

/**
 * Schema for resetting onboarding (if needed)
 */
export const resetOnboardingSchema = z.object({});