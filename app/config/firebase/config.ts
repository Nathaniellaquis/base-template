/**
 * Firebase Configuration
 * 
 * This file now only exports validation function.
 * The actual config is passed via factory pattern.
 */

import { FirebaseOptions } from 'firebase/app';

// Validation to ensure config is complete
export function validateFirebaseConfig(config: FirebaseOptions): boolean {
  const required = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missing = required.filter(key => !config[key as keyof FirebaseOptions]);
  
  if (missing.length > 0) {
    console.error(`Missing Firebase configuration: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
}