import { showError } from '@/lib/notifications/toast';

/**
 * Simple error handling for the app
 */

export function handleError(error: unknown, context?: string) {
  // Extract error message
  let message = 'An error occurred';
  
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  // Show error to user
  if (context) {
    showError(`${context}: ${message}`);
  } else {
    showError(message);
  }

  // Log for debugging
  console.error(`[Error${context ? ` in ${context}` : ''}]:`, error);
}