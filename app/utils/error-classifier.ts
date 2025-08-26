/**
 * Error classification utility for consistent error handling
 * Single source of truth for determining error types
 */

export const ErrorType = {
  NETWORK: 'NETWORK',     // No internet connection
  SERVER: 'SERVER',       // Backend down/unavailable
  AUTH: 'AUTH',          // Authentication/authorization errors
  UNKNOWN: 'UNKNOWN'     // Unclassified errors
} as const;

export type ErrorType = typeof ErrorType[keyof typeof ErrorType];

interface ClassifiedError {
  type: ErrorType;
  isConnectionIssue: boolean;  // Should show NetworkErrorScreen
  isAuthIssue: boolean;        // Should clear auth state
  originalError: any;
}

/**
 * Classifies errors into categories for appropriate handling
 */
export function classifyError(error: any): ClassifiedError {
  // No error
  if (!error) {
    return {
      type: ErrorType.UNKNOWN,
      isConnectionIssue: false,
      isAuthIssue: false,
      originalError: error
    };
  }

  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code;
  const httpStatus = error?.data?.httpStatus;

  // Network errors - no internet connection
  if (
    errorMessage.includes('network request failed') ||
    errorMessage.includes('fetch failed') ||
    errorMessage.includes('failed to fetch') ||
    errorCode === 'NETWORK_ERROR' ||
    !navigator.onLine
  ) {
    return {
      type: ErrorType.NETWORK,
      isConnectionIssue: true,
      isAuthIssue: false,
      originalError: error
    };
  }

  // Server errors - backend down or unavailable
  if (
    httpStatus >= 500 ||
    errorMessage.includes('econnrefused') ||
    errorMessage.includes('etimedout') ||
    errorMessage.includes('socket hang up')
  ) {
    return {
      type: ErrorType.SERVER,
      isConnectionIssue: true,
      isAuthIssue: false,
      originalError: error
    };
  }

  // Auth errors - user needs to authenticate
  if (
    httpStatus === 401 ||
    httpStatus === 403 ||
    errorCode === 'UNAUTHORIZED' ||
    errorCode === 'UNAUTHENTICATED' ||
    errorMessage.includes('user not found') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('forbidden')
  ) {
    return {
      type: ErrorType.AUTH,
      isConnectionIssue: false,
      isAuthIssue: true,
      originalError: error
    };
  }

  // Unknown errors - default to auth issue for safety
  return {
    type: ErrorType.UNKNOWN,
    isConnectionIssue: false,
    isAuthIssue: true,
    originalError: error
  };
}