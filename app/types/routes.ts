/**
 * Typed routes for Expo Router
 * This file provides type-safe route definitions
 */

export type AppRoute =
  | '/'
  | '/(tabs)/home'
  | '/(tabs)/profile'
  | '/(tabs)/settings'
  | '/(admin)'
  | '/(admin)/notifications'
  | '/(admin)/users'
  | '/(auth)'
  | '/(auth)/login'
  | '/(auth)/signup'
  | '/(auth)/forgot-password'
  | '/(onboarding)/welcome'
  | '/(onboarding)/profile-setup'
  | '/(onboarding)/plan-selection'
  | '/+not-found';

export type RouteParams = {
  '/(tabs)/settings': { section?: string };
  '/(onboarding)/plan-selection': { plan?: string };
};

// Helper type for router.push/replace
export type NavigationTarget = AppRoute | { pathname: AppRoute; params?: RouteParams[keyof RouteParams] };