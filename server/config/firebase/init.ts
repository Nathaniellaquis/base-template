/**
 * Firebase Initialization
 * Handles Firebase Admin SDK initialization
 */

import * as admin from 'firebase-admin';
import { firebaseConfig } from './config';
import { createLogger } from '../../utils/logging/logger';

const logger = createLogger('Firebase');

// Initialize Firebase Admin SDK
function initializeFirebase(): admin.app.App {
  // Check if already initialized
  if (admin.apps.length > 0) {
    logger.info('Firebase Admin SDK already initialized');
    return admin.app();
  }

  try {
    const app = admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig.credentials),
      projectId: firebaseConfig.projectId,
    });
    
    logger.info('Firebase Admin SDK initialized successfully');
    return app;
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
}

// Initialize on module load
const app = initializeFirebase();

// Export initialized services
export const auth = admin.auth(app);
export const firestore = admin.firestore(app);
export const storage = admin.storage(app);

// Export app instance for advanced usage
export { app };