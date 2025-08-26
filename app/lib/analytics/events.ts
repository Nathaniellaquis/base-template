export const EVENTS = {
  // Onboarding events
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_WELCOME_VIEWED: 'onboarding_welcome_viewed',
  ONBOARDING_PROFILE_COMPLETED: 'onboarding_profile_completed',
  ONBOARDING_VALUE_VIEWED: 'onboarding_value_viewed',
  ONBOARDING_COMPLETED: 'onboarding_completed',

  // User events
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
  USER_SIGNED_UP: 'user_signed_up',
  PROFILE_UPDATED: 'profile_updated',

  // Feature events
  FEATURE_USED: 'feature_used',
  FEATURE_ERROR: 'feature_error',
} as const;

export type EventName = typeof EVENTS[keyof typeof EVENTS];