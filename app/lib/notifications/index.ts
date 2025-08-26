/**
 * Notification Library Exports
 * External integrations for user notifications
 */

// Toast notifications
export {
  showError,
  showFormattedError,
  showSuccess,
  showInfo,
  showWarning
} from './toast';

// Deep linking
export {
  parseDeepLink,
  navigateFromNotification,
  setupNotificationHandlers,
  createNotificationDeepLink,
  type NotificationDeepLink
} from './deep-linking';