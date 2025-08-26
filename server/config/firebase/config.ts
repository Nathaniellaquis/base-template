/**
 * Firebase Configuration
 * Server-side Firebase Admin SDK configuration
 */

import { config } from '@/config';
import type * as admin from 'firebase-admin';

export interface FirebaseConfig {
  projectId: string;
  credentials: admin.ServiceAccount;
}

// Parse and validate Firebase configuration
function parseFirebaseCredentials(): admin.ServiceAccount {
  if (!config.firebase.adminCredentialsJson) {
    throw new Error('FIREBASE_ADMIN_CREDENTIALS environment variable is required');
  }

  try {
    const credentials = JSON.parse(config.firebase.adminCredentialsJson);
    
    // Validate required fields
    const requiredFields = ['project_id', 'private_key', 'client_email'];
    for (const field of requiredFields) {
      if (!credentials[field]) {
        throw new Error(`Missing required field in Firebase credentials: ${field}`);
      }
    }
    
    return credentials;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON in FIREBASE_ADMIN_CREDENTIALS');
    }
    throw error;
  }
}

export const firebaseConfig: FirebaseConfig = {
  projectId: config.firebase.projectId,
  credentials: parseFirebaseCredentials(),
};