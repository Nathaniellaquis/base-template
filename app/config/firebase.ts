import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from './index';

// Initialize Firebase (only once)
const app = getApps()[0] || initializeApp(firebaseConfig);

// Export only what we use
export const auth = getAuth(app);