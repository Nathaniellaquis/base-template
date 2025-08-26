import { config } from '@/config';

// Simple analytics utility
export const analytics = {
  track: (eventName: string, properties?: Record<string, any>) => {
    // Placeholder for analytics tracking
    if (config.isDevelopment) {
      console.log(`[ANALYTICS] Event: ${eventName}`, properties || {});
    }
  },
  identify: (userId: string, traits?: Record<string, any>) => {
    // Placeholder for user identification
    if (config.isDevelopment) {
      console.log(`[ANALYTICS] Identify: ${userId}`, traits || {});
    }
  },
  trackError: (error: unknown, context?: Record<string, any>) => {
    if (config.isDevelopment) {
      console.error(`[ANALYTICS] Error:`, error, context || {});
    }
  },
  trackPayment: (data: { userId: string; event: string; plan?: string; amount?: number; currency?: string; error?: string }) => {
    if (config.isDevelopment) {
      console.log(`[ANALYTICS] Payment:`, data);
    }
  },
  trackSlowRequest: (data: { method: string; path: string; duration: number; statusCode?: number; userId?: string; ip?: string; userAgent?: string }) => {
    if (config.isDevelopment) {
      console.log(`[ANALYTICS] Slow Request:`, data);
    }
  },
  trackFailedProcedure: (data: { procedure: string; error: string; userId?: string; type?: string; duration?: number }) => {
    if (config.isDevelopment) {
      console.log(`[ANALYTICS] Failed Procedure:`, data);
    }
  },
  trackAuthFailure: (data: { reason: string; path?: string; userId?: string; event?: string }) => {
    if (config.isDevelopment) {
      console.log(`[ANALYTICS] Auth Failure:`, data);
    }
  },
  shutdown: async () => {
    // Placeholder for graceful shutdown
    if (config.isDevelopment) {
      console.log(`[ANALYTICS] Shutting down...`);
    }
  }
};