import Toast from 'react-native-toast-message';
import { getFirebaseErrorMessage, formatFirebaseError } from '@/utils/firebase-errors';

// Proper error type that handles all possible error cases
type ErrorType = Error | { code: string; message: string } | string | null | undefined;

/**
 * Show error toast with Firebase error handling
 */
export function showError(error: ErrorType, fallbackMessage?: string) {
  const message = getFirebaseErrorMessage(error as Parameters<typeof getFirebaseErrorMessage>[0]) || fallbackMessage || 'An error occurred';
  
  Toast.show({
    type: 'error',
    text1: 'Error',
    text2: message,
    position: 'top',
    visibilityTime: 4000,
  });
}

/**
 * Show error toast with formatted Firebase error (title + message + action)
 */
export function showFormattedError(error: ErrorType) {
  const { title, message, action } = formatFirebaseError(error as Parameters<typeof formatFirebaseError>[0]);
  
  Toast.show({
    type: 'error',
    text1: title,
    text2: action ? `${message}\n${action}` : message,
    position: 'top',
    visibilityTime: 5000,
  });
}

/**
 * Show success toast
 */
export function showSuccess(title: string, message?: string) {
  Toast.show({
    type: 'success',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 3000,
  });
}

/**
 * Show info toast
 */
export function showInfo(title: string, message?: string) {
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 3000,
  });
}

/**
 * Show warning toast
 */
export function showWarning(title: string, message?: string) {
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 4000,
    props: {
      style: { borderLeftColor: '#FFA500' }
    }
  });
}