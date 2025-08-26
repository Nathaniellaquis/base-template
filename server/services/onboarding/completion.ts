/**
 * Onboarding Completion Service
 * Business logic for completing onboarding steps and the overall flow
 */

import { ObjectId } from 'mongodb';
import { getOnboardingCollection, getUserCollection } from '@/config/mongodb';
import { mongoDocToUser } from '@/utils/database/mongodb';
import { createLogger } from '@/utils/logging/logger';
import type { User, OnboardingDocument } from '@shared';

const logger = createLogger('OnboardingCompletionService');

/**
 * Complete the current onboarding step and move to next
 */
export async function completeStep(userId: string): Promise<{
  user: User;
  onboarding?: {
    currentStep: number;
    totalSteps: number;
    startedAt: Date;
    version: string;
  };
}> {
  const onboardingCollection = getOnboardingCollection();
  const usersCollection = getUserCollection();
  const { TOTAL_ONBOARDING_STEPS } = await import('@shared');
  
  // Get current onboarding state
  const onboarding = await onboardingCollection.findOne({
    userId: new ObjectId(userId)
  }) as OnboardingDocument | null;
  
  if (!onboarding) {
    throw new Error('Onboarding not started');
  }
  
  const newStep = onboarding.currentStep + 1;
  const isCompleted = newStep >= TOTAL_ONBOARDING_STEPS;
  
  // Update onboarding document
  await onboardingCollection.updateOne(
    { _id: onboarding._id },
    {
      $set: {
        currentStep: newStep,
        ...(isCompleted && { completedAt: new Date() })
      }
    }
  );
  
  // Mark user as onboarded if completed
  if (isCompleted) {
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          onboardingCompleted: true, 
          updatedAt: new Date() 
        } 
      }
    );
    
    logger.info('Onboarding completed', { userId });
  }
  
  // Get updated user
  const updatedUserDoc = await usersCollection.findOne({
    _id: new ObjectId(userId)
  });
  
  if (!updatedUserDoc) {
    throw new Error('User not found after update');
  }
  
  const updatedUser = mongoDocToUser(updatedUserDoc);
  
  // If not completed, attach onboarding progress
  if (!isCompleted) {
    const updatedOnboarding = await onboardingCollection.findOne({
      userId: new ObjectId(userId)
    }) as OnboardingDocument;
    
    return {
      user: updatedUser,
      onboarding: {
        currentStep: updatedOnboarding.currentStep,
        totalSteps: TOTAL_ONBOARDING_STEPS,
        startedAt: updatedOnboarding.startedAt,
        version: updatedOnboarding.version,
      },
    };
  }
  
  // Return complete user (onboarding is done)
  return { user: updatedUser };
}

/**
 * Skip to a specific step (admin function)
 */
export async function skipToStep(
  userId: string, 
  targetStep: number
): Promise<{
  currentStep: number;
  isCompleted: boolean;
}> {
  const onboardingCollection = getOnboardingCollection();
  const usersCollection = getUserCollection();
  const { TOTAL_ONBOARDING_STEPS } = await import('@shared');
  
  // Validate step
  if (targetStep < 0 || targetStep > TOTAL_ONBOARDING_STEPS) {
    throw new Error(`Invalid step: ${targetStep}`);
  }
  
  const onboarding = await onboardingCollection.findOne({
    userId: new ObjectId(userId)
  });
  
  if (!onboarding) {
    throw new Error('Onboarding not started');
  }
  
  const isCompleted = targetStep >= TOTAL_ONBOARDING_STEPS;
  
  // Update onboarding
  await onboardingCollection.updateOne(
    { userId: new ObjectId(userId) },
    {
      $set: {
        currentStep: targetStep,
        ...(isCompleted && { completedAt: new Date() })
      }
    }
  );
  
  // Update user if completed
  if (isCompleted) {
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          onboardingCompleted: true,
          updatedAt: new Date()
        } 
      }
    );
  }
  
  logger.info('Skipped to onboarding step', { 
    userId, 
    targetStep, 
    isCompleted 
  });
  
  return {
    currentStep: targetStep,
    isCompleted
  };
}

/**
 * Complete onboarding immediately (admin function)
 */
export async function completeOnboarding(userId: string): Promise<User> {
  const onboardingCollection = getOnboardingCollection();
  const usersCollection = getUserCollection();
  const { TOTAL_ONBOARDING_STEPS } = await import('@shared');
  
  // Update or create onboarding document
  await onboardingCollection.updateOne(
    { userId: new ObjectId(userId) },
    {
      $set: {
        currentStep: TOTAL_ONBOARDING_STEPS,
        completedAt: new Date()
      },
      $setOnInsert: {
        userId: new ObjectId(userId),
        startedAt: new Date(),
        version: '1.0'
      }
    },
    { upsert: true }
  );
  
  // Update user
  await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    { 
      $set: { 
        onboardingCompleted: true,
        updatedAt: new Date()
      } 
    }
  );
  
  // Get updated user
  const updatedUserDoc = await usersCollection.findOne({
    _id: new ObjectId(userId)
  });
  
  if (!updatedUserDoc) {
    throw new Error('User not found');
  }
  
  logger.info('Force completed onboarding', { userId });
  
  return mongoDocToUser(updatedUserDoc);
}

/**
 * Check if a specific step is accessible
 */
export async function canAccessStep(
  userId: string, 
  stepNumber: number
): Promise<boolean> {
  const onboardingCollection = getOnboardingCollection();
  const { TOTAL_ONBOARDING_STEPS } = await import('@shared');
  
  if (stepNumber < 0 || stepNumber >= TOTAL_ONBOARDING_STEPS) {
    return false;
  }
  
  const onboarding = await onboardingCollection.findOne({
    userId: new ObjectId(userId)
  });
  
  if (!onboarding) {
    return stepNumber === 0; // Can only access first step if not started
  }
  
  // Can access current step and all previous steps
  return stepNumber <= onboarding.currentStep;
}