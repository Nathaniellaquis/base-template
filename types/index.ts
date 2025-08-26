/**
 * Main barrel export for all shared types
 * Organized by domain/feature
 */

// Core types
export * from './auth';
export * from './user';
export * from './mongodb-validation';

// Feature types
export * from './notification';
export * from './onboarding';
export * from './payment';
export * from './theme';
export * from './experiments';

// Admin types
export * from './admin';