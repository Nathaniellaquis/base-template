import PostHog from 'posthog-react-native';

/**
 * PostHog Analytics Configuration for Native (iOS/Android)
 * Uses factory pattern to avoid circular dependencies
 */

/**
 * Creates and configures a PostHog instance for native platforms
 * @param apiKey - PostHog API key
 * @param host - PostHog host URL
 * @returns Configured PostHog instance
 */
export function createPostHog(apiKey: string, host: string): PostHog {
  return new PostHog(apiKey, {
    host,
    captureAppLifecycleEvents: true, // Fixed property name

    // Performance optimizations for mobile
    flushAt: 20, // Batch events to save battery
    flushInterval: 30000, // Flush every 30 seconds

    // Disable automatic screen tracking (we'll do it manually for better control)
    autocapture: false,

    // Enable debug mode in development
    debug: __DEV__,
  });
}