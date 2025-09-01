/**
 * Server-side Logging Utility
 * 
 * This module provides structured logging for server-side events.
 * Frontend analytics are handled by PostHog in the React Native app.
 * 
 * Note: This is NOT an analytics service - it's for server-side logging only.
 * For actual analytics, use PostHog on the frontend.
 */

import { logger } from '@/utils/logging';

export const serverLogger = {
  /**
   * Log general server events
   */
  logEvent: (eventName: string, properties?: Record<string, any>) => {
    logger.info(`[Event] ${eventName}`, properties);
  },

  /**
   * Log user identification (for debugging)
   */
  logUserAction: (userId: string, action: string, details?: Record<string, any>) => {
    logger.info(`[User:${userId}] ${action}`, details);
  },

  /**
   * Log errors with context
   */
  logError: (error: unknown, context?: Record<string, any>) => {
    logger.error('[Error]', { error, context });
  },

  /**
   * Log payment-related events
   */
  logPayment: (data: { 
    userId: string; 
    event: string; 
    plan?: string; 
    amount?: number; 
    currency?: string; 
    error?: string 
  }) => {
    logger.info('[Payment]', data);
  },

  /**
   * Log slow API requests for performance monitoring
   */
  logSlowRequest: (data: { 
    method: string; 
    path: string; 
    duration: number; 
    statusCode?: number; 
    userId?: string; 
  }) => {
    logger.warn('[Slow Request]', data);
  },

  /**
   * Log failed tRPC procedures
   */
  logFailedProcedure: (data: { 
    procedure: string; 
    error: string; 
    userId?: string; 
    duration?: number 
  }) => {
    logger.error('[Failed Procedure]', data);
  },

  /**
   * Log authentication failures for security monitoring
   */
  logAuthFailure: (data: { 
    reason: string; 
    path?: string; 
    userId?: string; 
  }) => {
    logger.warn('[Auth Failure]', data);
  },
};

