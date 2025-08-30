import { useRouter } from 'expo-router';
import { useOnboarding } from './useOnboarding';
import { ONBOARDING_STEPS } from '@/config/onboarding-steps';

/**
 * Hook for onboarding navigation actions
 * Provides methods to complete steps and navigate
 * Backend is the single source of truth for current step
 */
export function useOnboardingNavigation() {
  const router = useRouter();
  const { currentStep, totalSteps, onboardingCompleted, completeStep } = useOnboarding();
  
  /**
   * Complete current step and navigate to next
   * After backend updates, navigates based on the new step
   */
  const completeAndNavigate = async () => {
    try {
      await completeStep();
      
      const nextStep = currentStep + 1;
      
      if (nextStep >= totalSteps) {
        router.replace('/(tabs)/home');
      } else {
        const stepInfo = ONBOARDING_STEPS[nextStep];
        if (stepInfo) {
          console.log('[useOnboardingNavigation] Navigating to step:', {
            nextStep,
            stepInfo,
            route: stepInfo.route
          });
          router.replace(stepInfo.route as any);
        }
      }
    } catch (error) {
      console.error('Failed to complete onboarding step:', error);
      throw error;
    }
  };
  
  /**
   * Navigate to specific onboarding step (for debugging/testing)
   */
  const navigateToStep = (stepIndex: number) => {
    const step = ONBOARDING_STEPS[stepIndex];
    if (step) {
      router.push(step.route as any);
    }
  };
  
  /**
   * Get current step info from config
   */
  const getCurrentStepInfo = () => {
    if (onboardingCompleted) {
      return null;
    }
    return ONBOARDING_STEPS[currentStep] || null;
  };
  
  return {
    // Main action - complete step and navigate
    completeAndNavigate,
    
    // Debugging helper
    navigateToStep,
    
    // State info
    currentStep,
    totalSteps,
    onboardingCompleted,
    currentStepInfo: getCurrentStepInfo(),
    nextStepInfo: ONBOARDING_STEPS[currentStep + 1],
    isLastStep: currentStep >= totalSteps - 1,
  };
}