import posthog from 'posthog-js';

/**
 * PostHog Analytics Configuration for Web
 * Uses factory pattern to avoid circular dependencies
 */

// Export the posthog instance for web
export { posthog };

/**
 * Creates configuration for PostHog web initialization
 * @param apiKey - PostHog API key (not used directly here, initialized in provider)
 * @param host - PostHog host URL
 * @returns Configuration object for PostHog web
 */
export function createPostHogWebConfig(apiKey: string, host: string) {
  return {
    api_host: host,

    // Web-specific configuration
    capture_pageview: true,
    capture_pageleave: true,
    cross_subdomain_cookie: true,
    persistence: 'localStorage',

    // Advanced options
    autocapture: {
      dom_event_allowlist: ['click', 'submit', 'change'],
      css_selector_allowlist: ['[data-analytics]', '.analytics-track'],
    },

    // Privacy settings
    mask_all_text: false,
    mask_all_element_attributes: false,

    // Session recording (can be enabled later)
    disable_session_recording: true,

    // Performance
    capture_performance: true,

    // Feature flags
    bootstrap: {
      featureFlags: {},
    },
  };
}

// For consistency with native, export a factory that returns config
export function createPostHog(apiKey: string, host: string) {
  return { apiKey, config: createPostHogWebConfig(apiKey, host) };
}