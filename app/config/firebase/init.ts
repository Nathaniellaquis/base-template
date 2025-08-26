/**
 * Shared Firebase Initialization Logic
 * 
 * Common initialization code used by both web and native platforms
 */

import { initializeApp, getApps, getApp, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';

// Cache for initialized services
let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;

export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore | null; // null because we use MongoDB
}

/**
 * Factory function to create Firebase services
 * @param config - Firebase configuration options
 * @returns Object containing initialized Firebase services
 */
export function createFirebaseServices(config: FirebaseOptions): FirebaseServices {
  // Validate configuration
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
  for (const field of requiredFields) {
    if (!config[field as keyof FirebaseOptions]) {
      throw new Error(`Missing required Firebase config field: ${field}`);
    }
  }

  // Check if already initialized
  if (firebaseApp && firebaseAuth) {
    return {
      app: firebaseApp,
      auth: firebaseAuth,
      db: null, // We use MongoDB instead
    };
  }

  // Check for existing apps
  const apps = getApps();
  if (apps.length > 0) {
    firebaseApp = getApp();
    firebaseAuth = getAuth(firebaseApp);
    return {
      app: firebaseApp,
      auth: firebaseAuth,
      db: null,
    };
  }

  // Initialize new app
  try {
    firebaseApp = initializeApp(config);
    firebaseAuth = getAuth(firebaseApp);
    console.log('Firebase initialized successfully');
    
    return {
      app: firebaseApp,
      auth: firebaseAuth,
      db: null, // We use MongoDB instead
    };
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    throw error;
  }
}

/**
 * Reset Firebase instances (mainly for testing)
 */
export function resetFirebase(): void {
  firebaseApp = null;
  firebaseAuth = null;
}