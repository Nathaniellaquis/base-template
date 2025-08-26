/**
 * Onboarding Progress Service
 * Business logic for tracking onboarding progress
 */

import { ObjectId } from 'mongodb';
import { getOnboardingCollection, getUserCollection } from '@/config/mongodb';
import { createLogger } from '@/utils/logging/logger';
import type { OnboardingDocument } from '@shared';

const logger = createLogger('OnboardingProgressService');

/**
 * Get onboarding progress for a user
 */
export async function getOnboardingProgress(userId: string): Promise<{
  currentStep: number;
  totalSteps: number;
  startedAt: Date;
  completedAt?: Date;
  version: string;
  isCompleted: boolean;
} | null> {
  const onboardingCollection = getOnboardingCollection();
  const onboarding = await onboardingCollection.findOne({
    userId: new ObjectId(userId)
  }) as OnboardingDocument | null;
  
  if (!onboarding) {
    return null;
  }
  
  const { TOTAL_ONBOARDING_STEPS } = await import('@shared');
  
  return {
    currentStep: onboarding.currentStep,
    totalSteps: TOTAL_ONBOARDING_STEPS,
    startedAt: onboarding.startedAt,
    completedAt: onboarding.completedAt,
    version: onboarding.version,
    isCompleted: !!onboarding.completedAt
  };
}

/**
 * Update onboarding progress
 */
export async function updateOnboardingProgress(
  userId: string,
  newStep: number
): Promise<{
  currentStep: number;
  isCompleted: boolean;
}> {
  const onboardingCollection = getOnboardingCollection();
  const { TOTAL_ONBOARDING_STEPS } = await import('@shared');
  
  // Validate step
  if (newStep < 0 || newStep > TOTAL_ONBOARDING_STEPS) {
    throw new Error(`Invalid step: ${newStep}. Must be between 0 and ${TOTAL_ONBOARDING_STEPS}`);
  }
  
  const isCompleted = newStep >= TOTAL_ONBOARDING_STEPS;
  
  const result = await onboardingCollection.findOneAndUpdate(
    { userId: new ObjectId(userId) },
    {
      $set: {
        currentStep: newStep,
        ...(isCompleted && { completedAt: new Date() })
      }
    },
    { returnDocument: 'after' }
  );
  
  if (!result) {
    throw new Error('Onboarding not found');
  }
  
  logger.info('Updated onboarding progress', {
    userId,
    newStep,
    isCompleted
  });
  
  return {
    currentStep: newStep,
    isCompleted
  };
}

/**
 * Start onboarding for a user
 */
export async function startOnboarding(
  userId: string,
  version: string = '1.0'
): Promise<OnboardingDocument> {
  const onboardingCollection = getOnboardingCollection();
  
  // Check if already exists
  const existing = await onboardingCollection.findOne({
    userId: new ObjectId(userId)
  });
  
  if (existing) {
    logger.warn('Onboarding already started', { userId });
    return existing as OnboardingDocument;
  }
  
  const onboarding: Omit<OnboardingDocument, '_id'> = {
    userId: new ObjectId(userId),
    currentStep: 0,
    startedAt: new Date(),
    version
  };
  
  const result = await onboardingCollection.insertOne(onboarding);
  
  logger.info('Started onboarding', { userId, version });
  
  return {
    _id: result.insertedId,
    ...onboarding
  };
}

/**
 * Reset onboarding progress
 */
export async function resetOnboarding(userId: string): Promise<void> {
  const onboardingCollection = getOnboardingCollection();
  const usersCollection = getUserCollection();
  
  // Delete onboarding document
  await onboardingCollection.deleteOne({
    userId: new ObjectId(userId)
  });
  
  // Update user
  await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    { 
      $set: { 
        onboardingCompleted: false,
        updatedAt: new Date()
      } 
    }
  );
  
  logger.info('Reset onboarding', { userId });
}

/**
 * Get onboarding stats
 */
export async function getOnboardingStats(): Promise<{
  total: number;
  completed: number;
  inProgress: number;
  completionRate: number;
  averageStepsCompleted: number;
  stepDropoff: Record<number, number>;
}> {
  const onboardingCollection = getOnboardingCollection();
  const { TOTAL_ONBOARDING_STEPS } = await import('@shared');
  
  const [total, completed, stepCounts] = await Promise.all([
    onboardingCollection.countDocuments(),
    onboardingCollection.countDocuments({ completedAt: { $exists: true } }),
    onboardingCollection.aggregate([
      {
        $group: {
          _id: '$currentStep',
          count: { $sum: 1 }
        }
      }
    ]).toArray()
  ]);
  
  const inProgress = total - completed;
  const completionRate = total > 0 ? (completed / total) * 100 : 0;
  
  // Calculate average steps completed
  const totalSteps = stepCounts.reduce((sum, s) => sum + (s._id * s.count), 0);
  const averageStepsCompleted = total > 0 ? totalSteps / total : 0;
  
  // Calculate step dropoff
  const stepDropoff: Record<number, number> = {};
  for (let i = 0; i <= TOTAL_ONBOARDING_STEPS; i++) {
    const atStep = stepCounts.find(s => s._id === i)?.count || 0;
    const beyondStep = stepCounts
      .filter(s => s._id > i)
      .reduce((sum, s) => sum + s.count, 0);
    
    stepDropoff[i] = total > 0 
      ? ((total - atStep - beyondStep) / total) * 100 
      : 0;
  }
  
  return {
    total,
    completed,
    inProgress,
    completionRate,
    averageStepsCompleted,
    stepDropoff
  };
}