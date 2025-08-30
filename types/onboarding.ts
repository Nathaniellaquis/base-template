import { ObjectId } from 'mongodb';
import { z } from 'zod';

// NOTE: The total onboarding steps is dynamic based on feature flags
// Server: Use getTotalOnboardingSteps() from @/services/onboarding/config
// Client: Use TOTAL_ONBOARDING_STEPS from @/config/onboarding-steps

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