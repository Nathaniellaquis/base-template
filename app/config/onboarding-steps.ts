// Onboarding configuration constants
export const TOTAL_ONBOARDING_STEPS = 4; // Welcome + Profile Setup + Value Recap + Plan Selection

// You can add more configuration here as needed
export const ONBOARDING_VERSION = 1;

// Step identifiers for type safety
export const ONBOARDING_STEP_IDS = {
  WELCOME: 0,
  PROFILE_SETUP: 1,
  VALUE_RECAP: 2,
  PLAN_SELECTION: 3, // Paywall step
} as const;

export type OnboardingStepId = typeof ONBOARDING_STEP_IDS[keyof typeof ONBOARDING_STEP_IDS];

// Onboarding step definitions with routes
export interface OnboardingStep {
  id: string;
  title: string;
  route: string;
  description?: string;
  required: boolean;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    route: '/(onboarding)/welcome',
    description: 'Introduction to the app',
    required: true
  },
  {
    id: 'profile-setup',
    title: 'Profile Setup',
    route: '/(onboarding)/profile-setup',
    description: 'Set up your profile',
    required: true
  },
  {
    id: 'value-recap',
    title: 'Value Recap',
    route: '/(onboarding)/value-recap',
    description: 'Discover what we offer',
    required: true
  },
  {
    id: 'plan-selection',
    title: 'Choose Your Plan',
    route: '/(onboarding)/plan-selection',
    description: 'Select the perfect plan for you',
    required: true
  }
];