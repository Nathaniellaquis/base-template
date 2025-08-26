/**
 * Firebase Module Main Export
 * 
 * Provides exports for Firebase configuration and types.
 * Services are now initialized via factory pattern in config/index.ts
 */

// Re-export validation function
export { validateFirebaseConfig } from './config';

// Export factory function
export { createFirebaseServices, resetFirebase } from './init';
export type { FirebaseServices } from './init';

// Helper to check if we're in a web environment
export const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';

// Type exports
export type { FirebaseOptions } from 'firebase/app';
export type { User, UserCredential } from 'firebase/auth';