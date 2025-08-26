/**
 * Firebase Module
 * Centralized Firebase configuration and exports
 */

// Export configuration
export { firebaseConfig } from './config';
export type { FirebaseConfig } from './config';

// Export initialized services
export { auth, firestore, storage, app } from './init';

// Re-export commonly used types
export type { 
  UserRecord,
  DecodedIdToken,
  ListUsersResult,
} from 'firebase-admin/auth';

export type {
  DocumentData,
  QuerySnapshot,
  DocumentReference,
} from 'firebase-admin/firestore';