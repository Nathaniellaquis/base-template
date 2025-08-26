/**
 * PostHog Analytics Configuration
 * Platform-specific exports - Metro bundler will automatically resolve to .web or .native
 */

// Export factory function from the native file (Metro will resolve to .web on web platform)
export { createPostHog } from './posthog.native';
