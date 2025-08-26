import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useOnboarding } from '@/hooks/useOnboarding';
import { ONBOARDING_STEPS } from '@/config/onboarding-steps';
import { LoadingScreen } from '@/components/common/LoadingScreen';

export default function OnboardingIndex() {
  const router = useRouter();
  const { currentStep, onboardingCompleted, loading } = useOnboarding();
  
  useEffect(() => {
    // Navigate to the correct onboarding step based on backend state
    if (!loading) {
      if (onboardingCompleted) {
        // Onboarding complete - shouldn't happen here but handle it
        router.replace('/(tabs)/home');
      } else {
        // Navigate to the current onboarding step
        const step = ONBOARDING_STEPS[currentStep];
        if (step) {
          router.replace(step.route as any);
        } else {
          // Fallback to first step
          router.replace('/(onboarding)/welcome');
        }
      }
    }
  }, [currentStep, onboardingCompleted, loading, router]);
  
  // Show loading while determining where to navigate
  return <LoadingScreen />;
}