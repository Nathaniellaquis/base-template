import React, { createContext, useState } from 'react';
import { useAuth } from '@/providers/auth';
import { trpc } from '@/providers/trpc';
import { TOTAL_ONBOARDING_STEPS as TOTAL_STEPS } from '@/config/onboarding-steps';
import type { User } from '@shared';
import { ConversionEvents, conversionTracker } from '@/lib/experiments/conversion';
import { trackOnboarding, trackEvent } from '@/lib/analytics';

interface OnboardingContextType {
  onboardingCompleted: boolean;
  currentStep: number;
  totalSteps: number;
  loading: boolean;
  completeStep: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user, setUser } = useAuth();
  const utils = trpc.useContext();
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const completeStepMutation = trpc.onboarding.updateOnboarding.useMutation({
    onMutate: () => {
      setIsTransitioning(true);
    },
    onSuccess: (updatedUser: User) => {
      setUser(updatedUser);
      utils.user.get.setData(undefined, updatedUser);
      
      const newStep = updatedUser.onboarding?.currentStep ?? 0;
      const isCompleted = updatedUser.onboardingCompleted;
      
      if (isCompleted && !user?.onboardingCompleted) {
        conversionTracker.trackConversion(
          ConversionEvents.ONBOARDING_COMPLETED,
          {
            customProperties: {
              totalSteps: updatedUser.onboarding?.totalSteps ?? TOTAL_STEPS,
              completedAt: new Date().toISOString(),
            }
          },
          updatedUser.uid
        );
        
        trackOnboarding.completeOnboarding();
      } else if (newStep > (user?.onboarding?.currentStep ?? 0)) {
        trackEvent('onboarding_step_completed', {
          step: newStep,
          totalSteps: updatedUser.onboarding?.totalSteps ?? TOTAL_STEPS,
        });
      }
    },
    onSettled: () => {
      setIsTransitioning(false);
    }
  });

  // If no user, provide default non-loading state
  if (!user) {
    const defaultValue: OnboardingContextType = {
      onboardingCompleted: false,
      currentStep: 0,
      totalSteps: TOTAL_STEPS,
      loading: false,
      completeStep: async () => {},
    };

    return (
      <OnboardingContext.Provider value={defaultValue}>
        {children}
      </OnboardingContext.Provider>
    );
  }

  // Get onboarding state directly from user (no duplicate fetch!)
  const onboardingCompleted = user.onboardingCompleted ?? false;
  const actualStep = user.onboarding?.currentStep ?? 0;
  const totalSteps = user.onboarding?.totalSteps ?? TOTAL_STEPS;
  
  // When transitioning, show the next step in progress bar
  const currentStep = isTransitioning ? actualStep + 1 : actualStep;

  const value: OnboardingContextType = {
    onboardingCompleted,
    currentStep,
    totalSteps,
    loading: false,
    completeStep: async () => {
      await completeStepMutation.mutateAsync({ action: 'complete' });
    },
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export { OnboardingContext };