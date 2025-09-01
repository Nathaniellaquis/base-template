/**
 * Services Module
 * Central export point for all service modules
 * This allows for cleaner imports: import { userService, notificationService } from '@/services'
 */

// User services
export * as userService from './user';

// Notification services
export * as notificationService from './notifications';

// Admin services
export * as adminService from './admin';

// Experiment services
export * as experimentService from './experiment';

// Onboarding services
export * as onboardingService from './onboarding';

// Re-export commonly used functions directly
export {
  // User
  createUser,
  findUserByUid,
  setUserCustomClaims
} from './user';

export {
  // Notifications
  createNotification,
  getNotifications,
  deleteNotification,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  registerPushToken,
  updateNotificationPreferences
} from './notifications';

export {
  // Admin
  getAllUsers,
  updateUserRole,
  getUserDetails,
  getSystemStats,
  sendTestNotification,
  getAllNotifications as getAllAdminNotifications
} from './admin';

export {
  // Experiments
  createExperiment,
  updateExperiment,
  getExperiment,
  listExperiments,
  deleteExperiment,
  evaluateExperiment,
  trackExposure,
  trackConversion,
  getExperimentMetrics
} from './experiment';

export {
  // Onboarding
  startOnboarding,
  completeStep,
  getOnboardingProgress,
  updateOnboardingProgress,
  resetOnboarding,
  skipToStep,
  completeOnboarding,
  canAccessStep
} from './onboarding';