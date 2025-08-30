import { APP_CONFIG } from './index';

// Onboarding configuration constants
export const TOTAL_ONBOARDING_STEPS = APP_CONFIG.features.enableWorkspaces ? 5 : 4;

// You can add more configuration here as needed
export const ONBOARDING_VERSION = 1;

// Step identifiers for type safety
export const ONBOARDING_STEP_IDS = {
  WELCOME: 0,
  PROFILE_SETUP: 1,
  WORKSPACE_SELECTION: 2, // Only when workspaces enabled
  VALUE_RECAP: APP_CONFIG.features.enableWorkspaces ? 3 : 2,
  PLAN_SELECTION: APP_CONFIG.features.enableWorkspaces ? 4 : 3,
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

// Build steps dynamically based on features
const baseSteps: OnboardingStep[] = [
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
  }
];

const workspaceStep: OnboardingStep = {
  id: 'workspace-selection',
  title: 'Workspace Setup',
  route: '/(onboarding)/workspace-selection',
  description: 'Create or join a workspace',
  required: true
};

const finalSteps: OnboardingStep[] = [
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

export const ONBOARDING_STEPS: OnboardingStep[] = [
  ...baseSteps,
  ...(APP_CONFIG.features.enableWorkspaces ? [workspaceStep] : []),
  ...finalSteps
];