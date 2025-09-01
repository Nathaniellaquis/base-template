/**
 * Comprehensive Firebase Error Handler
 * Handles ALL Firebase Auth errors across all platforms and auth methods
 */

// Define proper Firebase error type
interface FirebaseError {
  code: string;
  message: string;
  name?: string;
  stack?: string;
}

// Type guard to check if an error is a Firebase error
function isFirebaseError(error: Error | FirebaseError | string | null | undefined): error is FirebaseError {
  return (
    error !== null &&
    error !== undefined &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string'
  );
}

const errorMessages: Record<string, string> = {
  // ============= EMAIL/PASSWORD ERRORS =============
  'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',
  'auth/weak-password': 'Password should be at least 6 characters long.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/user-not-found': 'No account found with this email. Please sign up instead.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-credential': 'Invalid email or password. Please try again.',
  'auth/invalid-verification-code': 'Invalid verification code. Please try again.',
  'auth/invalid-verification-id': 'Invalid verification ID. Please try again.',
  'auth/missing-email': 'Please enter your email address.',
  'auth/missing-password': 'Please enter your password.',

  // ============= OAUTH ERRORS (Google, Apple, Facebook, etc.) =============
  'auth/account-exists-with-different-credential': 'An account already exists with the same email but different sign-in credentials. Sign in using the original provider.',
  'auth/auth-domain-config-required': 'Authentication configuration error. Please contact support.',
  'auth/cancelled-popup-request': 'Another popup is already open. Please close it and try again.',
  'auth/operation-not-supported-in-this-environment': 'This operation is not supported in your current environment.',
  'auth/popup-blocked': 'Sign-in popup was blocked by your browser. Please allow popups and try again.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/unauthorized-domain': 'This domain is not authorized for sign-in. Please contact support.',
  'auth/invalid-oauth-provider': 'Invalid OAuth provider. Please contact support.',
  'auth/invalid-oauth-client-id': 'Invalid OAuth client configuration. Please contact support.',
  'auth/oauth-client-error': 'OAuth client error. Please try again.',

  // ============= APPLE SIGN-IN SPECIFIC =============
  'auth/invalid-credential-apple': 'Apple Sign-In failed. Please try again.',
  'auth/apple-signin-failed': 'Apple Sign-In failed. Please check your Apple ID settings.',
  'auth/missing-or-invalid-nonce': 'Apple Sign-In security check failed. Please try again.',

  // ============= GOOGLE SIGN-IN SPECIFIC =============
  'auth/invalid-credential-google': 'Google Sign-In failed. Please try again.',
  'auth/google-signin-failed': 'Google Sign-In failed. Please check your Google account.',

  // ============= PHONE AUTH ERRORS =============
  'auth/missing-phone-number': 'Please enter a phone number.',
  'auth/invalid-phone-number': 'Please enter a valid phone number.',
  'auth/missing-verification-code': 'Please enter the verification code.',
  'auth/quota-exceeded': 'SMS quota exceeded. Please try again later.',
  'auth/captcha-check-failed': 'reCAPTCHA verification failed. Please try again.',
  'auth/missing-app-credential': 'Phone authentication configuration error.',

  // ============= MULTI-FACTOR AUTH ERRORS =============
  'auth/multi-factor-auth-required': 'Additional authentication required. Please complete the second factor.',
  'auth/missing-multi-factor-info': 'No second factor information found.',
  'auth/missing-multi-factor-session': 'Multi-factor session expired. Please sign in again.',
  'auth/second-factor-already-in-use': 'This second factor is already associated with another account.',
  'auth/maximum-second-factor-count-exceeded': 'Maximum number of second factors exceeded.',
  'auth/unsupported-first-factor': 'Unsupported first factor authentication method.',

  // ============= TOKEN/SESSION ERRORS =============
  'auth/invalid-user-token': 'Your session has expired. Please sign in again.',
  'auth/user-token-expired': 'Your session has expired. Please sign in again.',
  'auth/null-user': 'No user is currently signed in.',
  'auth/requires-recent-login': 'This action requires recent authentication. Please sign in again.',
  'auth/invalid-auth': 'Invalid authentication credentials.',
  'auth/invalid-refresh-token': 'Invalid refresh token. Please sign in again.',
  'auth/invalid-id-token': 'Invalid ID token. Please sign in again.',
  'auth/id-token-expired': 'ID token has expired. Please sign in again.',
  'auth/id-token-revoked': 'ID token has been revoked. Please sign in again.',
  'auth/credential-already-in-use': 'This credential is already associated with another account.',

  // ============= NETWORK ERRORS =============
  'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
  'auth/timeout': 'Request timed out. Please check your connection and try again.',
  'auth/no-internet': 'No internet connection. Please check your network settings.',
  'auth/too-many-requests': 'Too many failed attempts. Please wait a few minutes and try again.',

  // ============= WEB-SPECIFIC ERRORS =============
  'auth/web-storage-unsupported': 'Your browser does not support web storage or it is disabled. Please enable cookies and try again.',
  'auth/already-initialized': 'Firebase Auth is already initialized.',
  'auth/cors-unsupported': 'CORS is not supported by your browser.',
  'auth/dynamic-link-not-activated': 'Dynamic links are not configured. Please contact support.',
  'auth/invalid-persistence-type': 'Invalid persistence type specified.',
  'auth/unsupported-persistence-type': 'Current environment does not support the specified persistence type.',

  // ============= MOBILE-SPECIFIC ERRORS =============
  'auth/app-not-authorized': 'This app is not authorized to use Firebase Authentication. Please verify your app configuration.',
  'auth/app-not-installed': 'The required app is not installed on your device.',
  'auth/app-verification-failed': 'App verification failed. Please try again.',
  'auth/missing-android-pkg-name': 'Android package name is required.',
  'auth/missing-ios-bundle-id': 'iOS bundle ID is required.',
  'auth/invalid-cordova-configuration': 'Invalid Cordova configuration.',
  'auth/invalid-app-credential': 'Invalid app credential. Please check your app configuration.',

  // ============= EMULATOR ERRORS =============
  'auth/emulator-config-failed': 'Auth emulator configuration failed.',
  'auth/firebase-auth-emulator-warning': 'You are using the Firebase Auth emulator.',

  // ============= ADMIN SDK ERRORS =============
  'auth/claims-too-large': 'Custom claims payload exceeds maximum allowed size.',
  'auth/insufficient-permission': 'You do not have permission to perform this action.',
  'auth/invalid-argument': 'Invalid argument provided.',
  'auth/invalid-claims': 'Invalid custom claims provided.',
  'auth/invalid-creation-time': 'Invalid creation time.',
  'auth/invalid-disabled-field': 'Invalid disabled field value.',
  'auth/invalid-display-name': 'Invalid display name.',
  'auth/invalid-hash-algorithm': 'Invalid hash algorithm.',
  'auth/invalid-hash-block-size': 'Invalid hash block size.',
  'auth/invalid-hash-derived-key-length': 'Invalid hash derived key length.',
  'auth/invalid-hash-key': 'Invalid hash key.',
  'auth/invalid-hash-memory-cost': 'Invalid hash memory cost.',
  'auth/invalid-hash-parallelization': 'Invalid hash parallelization.',
  'auth/invalid-hash-rounds': 'Invalid hash rounds.',
  'auth/invalid-hash-salt-separator': 'Invalid hash salt separator.',
  'auth/invalid-last-sign-in-time': 'Invalid last sign-in time.',
  'auth/invalid-page-token': 'Invalid page token.',
  'auth/invalid-password': 'Invalid password. Password must be at least 6 characters.',
  'auth/invalid-password-hash': 'Invalid password hash.',
  'auth/invalid-password-salt': 'Invalid password salt.',
  'auth/invalid-photo-url': 'Invalid photo URL.',
  'auth/invalid-provider-data': 'Invalid provider data.',
  'auth/invalid-provider-id': 'Invalid provider ID.',
  'auth/invalid-session-cookie-duration': 'Invalid session cookie duration.',
  'auth/invalid-uid': 'Invalid user ID.',
  'auth/maximum-user-count-exceeded': 'Maximum user count exceeded.',
  'auth/missing-uid': 'User ID is required.',
  'auth/reserved-claims': 'Reserved custom claims used.',
  'auth/session-cookie-expired': 'Session cookie has expired.',
  'auth/session-cookie-revoked': 'Session cookie has been revoked.',
  'auth/uid-already-exists': 'A user with this ID already exists.',

  // ============= PASSWORD RESET ERRORS =============
  'auth/invalid-action-code': 'This action code is invalid. It may have been used already or expired.',
  'auth/expired-action-code': 'This action code has expired. Please request a new password reset.',
  'auth/missing-continue-uri': 'Continue URL is required for password reset.',
  'auth/invalid-continue-uri': 'Invalid continue URL provided.',
  'auth/unauthorized-continue-uri': 'Domain of continue URL is not whitelisted.',

  // ============= TENANT ERRORS =============
  'auth/invalid-tenant-id': 'Invalid tenant ID.',
  'auth/mismatching-tenant-id': 'Tenant ID mismatch.',
  'auth/tenant-id-mismatch': 'Tenant ID does not match.',
  'auth/unsupported-tenant-operation': 'This operation is not supported in multi-tenant context.',

  // ============= GENERIC/FALLBACK ERRORS =============
  'auth/internal-error': 'An internal error occurred. Please try again later.',
  'auth/invalid-api-key': 'Invalid API key. Please check your Firebase configuration.',
  'auth/project-not-found': 'Firebase project not found. Please check your configuration.',
  'auth/argument-error': 'Invalid argument provided. Please check your input.',

  // ============= CUSTOM APP ERRORS =============
  'auth/user-cancelled': 'Sign-in was cancelled by the user.',
  'auth/unknown-error': 'An unknown error occurred. Please try again.',

  // Default fallback
  'default': 'An unexpected error occurred. Please try again later.',
};

/**
 * Get user-friendly error message from Firebase error
 */
export function getFirebaseErrorMessage(error: Error | FirebaseError | string | null | undefined): string {
  if (!error) {
    return errorMessages.default;
  }

  // Handle Firebase Auth errors
  if (isFirebaseError(error)) {
    return errorMessages[error.code] || errorMessages.default;
  }

  // Handle regular Error objects
  if (error instanceof Error) {
    // Check if message contains Firebase error code
    const match = error.message.match(/\(auth\/[^)]+\)/);
    if (match) {
      const code = match[0].slice(1, -1); // Remove parentheses
      return errorMessages[code] || error.message;
    }
    return error.message;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  return errorMessages.default;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: Error | FirebaseError | string | null | undefined): boolean {
  return isFirebaseError(error) && error.code === 'auth/network-request-failed';
}

/**
 * Check if error requires reauthentication
 */
export function requiresReauth(error: Error | FirebaseError | string | null | undefined): boolean {
  if (!isFirebaseError(error)) return false;
  
  const reauthCodes = [
    'auth/requires-recent-login',
    'auth/user-token-expired',
    'auth/invalid-user-token',
    'auth/id-token-expired',
    'auth/id-token-revoked',
    'auth/session-cookie-expired',
    'auth/session-cookie-revoked'
  ];
  
  return reauthCodes.includes(error.code);
}

/**
 * Check if error is due to existing account with different credential
 */
export function isAccountConflict(error: Error | FirebaseError | string | null | undefined): boolean {
  if (!isFirebaseError(error)) return false;
  
  const conflictCodes = [
    'auth/account-exists-with-different-credential',
    'auth/credential-already-in-use',
    'auth/email-already-in-use'
  ];
  
  return conflictCodes.includes(error.code);
}

/**
 * Check if error is due to rate limiting
 */
export function isRateLimited(error: Error | FirebaseError | string | null | undefined): boolean {
  if (!isFirebaseError(error)) return false;
  
  return error.code === 'auth/too-many-requests' || error.code === 'auth/quota-exceeded';
}

/**
 * Check if error is OAuth specific
 */
export function isOAuthError(error: Error | FirebaseError | string | null | undefined): boolean {
  if (!isFirebaseError(error)) return false;
  
  return error.code.includes('oauth') ||
    error.code.includes('popup') ||
    error.code.includes('apple') ||
    error.code.includes('google') ||
    error.code === 'auth/unauthorized-domain';
}


/**
 * Check if error is due to invalid configuration
 */
export function isConfigError(error: Error | FirebaseError | string | null | undefined): boolean {
  if (!isFirebaseError(error)) return false;
  
  const configCodes = [
    'auth/invalid-api-key',
    'auth/project-not-found',
    'auth/app-not-authorized',
    'auth/operation-not-allowed',
    'auth/auth-domain-config-required',
    'auth/invalid-oauth-client-id'
  ];
  
  return configCodes.includes(error.code);
}

/**
 * Get suggested action for error
 */
export function getSuggestedAction(error: Error | FirebaseError | string | null | undefined): string | null {
  if (isNetworkError(error)) {
    return 'Check your internet connection';
  }
  if (requiresReauth(error)) {
    return 'Please sign in again';
  }
  if (isAccountConflict(error)) {
    return 'Try signing in with your original provider';
  }
  if (isRateLimited(error)) {
    return 'Please wait a few minutes before trying again';
  }
  if (isConfigError(error)) {
    return 'Please contact support';
  }
  return null;
}

/**
 * Format error for display with title and message
 */
export function formatFirebaseError(error: Error | FirebaseError | string | null | undefined): { title: string; message: string; action?: string } {
  const message = getFirebaseErrorMessage(error);
  const action = getSuggestedAction(error);

  let title = 'Error';

  if (isNetworkError(error)) {
    title = 'Connection Error';
  } else if (requiresReauth(error)) {
    title = 'Session Expired';
  } else if (isAccountConflict(error)) {
    title = 'Account Conflict';
  } else if (isRateLimited(error)) {
    title = 'Too Many Attempts';
  } else if (isOAuthError(error)) {
    title = 'Sign-In Failed';
  } else if (isConfigError(error)) {
    title = 'Configuration Error';
  }

  return { title, message, action: action || undefined };
}