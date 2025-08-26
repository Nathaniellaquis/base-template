import { protectedProcedure, router } from '@/trpc/trpc';
import { updateOnboardingSchema } from '@shared';
import { completeStep } from '@/services/onboarding/completion';
import { getOnboardingProgress } from '@/services/onboarding/progress';

export const onboardingRouter = router({
  updateOnboarding: protectedProcedure
    .input(updateOnboardingSchema)
    .mutation(async ({ ctx, input }) => {
      const { action } = input;
      const { user } = ctx;

      if (action === 'complete') {
        // Use the service function to complete the step
        const result = await completeStep(user._id!);
        
        // If onboarding is still in progress, return user with onboarding data
        if (result.onboarding) {
          return {
            ...result.user,
            onboarding: result.onboarding
          };
        }
        
        // Otherwise, just return the user (onboarding is complete)
        return result.user;
      }

      // For navigate action or any other future actions
      // Get current progress and return user with it
      const progress = await getOnboardingProgress(user._id!);
      
      if (!progress) {
        throw new Error('Onboarding not started');
      }
      
      return {
        ...user,
        onboarding: {
          currentStep: progress.currentStep,
          totalSteps: progress.totalSteps,
          startedAt: progress.startedAt,
          version: progress.version,
        },
      };
    }),
});