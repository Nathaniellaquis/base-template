/**
 * Onboarding Configuration
 * Dynamic configuration based on feature flags
 */

import { config } from '@/config';

/**
 * Get the total number of onboarding steps based on enabled features
 * - When workspaces are enabled: Welcome + Profile Setup + Workspace Selection + Value Recap + Plan Selection = 5
 * - When workspaces are disabled: Welcome + Profile Setup + Value Recap + Plan Selection = 4
 */
export function getTotalOnboardingSteps(): number {
  return config.enableWorkspaces ? 5 : 4;
}

/**
 * Step indices for consistency
 */
export const ONBOARDING_STEPS = {
  WELCOME: 0,
  PROFILE_SETUP: 1,
  WORKSPACE_SELECTION: config.enableWorkspaces ? 2 : -1, // -1 when disabled
  VALUE_RECAP: config.enableWorkspaces ? 3 : 2,
  PLAN_SELECTION: config.enableWorkspaces ? 4 : 3,
} as const;