import { protectedProcedure } from '@/trpc/trpc';
import { getOnboardingCollection, getUserCollection } from '@/config/mongodb';
import { ObjectId } from 'mongodb';
import { OnboardingDocument, TOTAL_ONBOARDING_STEPS } from '@shared';
import { mongoDocToUser } from '@/utils/database/mongodb';

export const getUser = protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx;
    
    // Fetch fresh user to ensure we have latest data
    // ctx.user comes from the token which may be outdated
    const usersCollection = getUserCollection();
    const freshUserDoc = await usersCollection.findOne({ 
        _id: new ObjectId(user._id) 
    });
    
    if (!freshUserDoc) {
        throw new Error('User not found');
    }
    
    // Convert MongoDB document to User type with string _id
    const freshUser = mongoDocToUser(freshUserDoc);
    
    // If onboarding not completed, attach onboarding progress
    if (!freshUser.onboardingCompleted) {
        const onboardingCollection = getOnboardingCollection();
        let onboarding = await onboardingCollection.findOne({ 
            userId: new ObjectId(user._id) 
        }) as OnboardingDocument | null;
        
        if (!onboarding) {
            // Create new onboarding document
            const newOnboarding: OnboardingDocument = {
                userId: new ObjectId(user._id),
                currentStep: 0,
                startedAt: new Date(),
                version: '1.0',
            };
            
            const onboardingInsertResult = await onboardingCollection.insertOne(newOnboarding);
            onboarding = { ...newOnboarding, _id: onboardingInsertResult.insertedId };
        }
        
        return {
            ...freshUser,
            onboarding: {
                currentStep: onboarding.currentStep,
                totalSteps: TOTAL_ONBOARDING_STEPS,
                startedAt: onboarding.startedAt,
                version: onboarding.version,
            },
        };
    }
    
    // Return the fresh user from database
    return freshUser;
});