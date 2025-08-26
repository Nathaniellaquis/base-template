/**
 * Crash Reporter Configuration
 * 
 * This module provides crash reporting functionality for the app.
 * Currently using console.error as a placeholder until Sentry is integrated.
 * 
 * TODO: Replace console.error with Sentry once installed
 */

interface CrashReporterContext {
  errorInfo?: any;
  context?: string;
  tags?: Record<string, string>;
  contexts?: Record<string, any>;
  user?: {
    id: string;
    email?: string;
  };
}

interface Breadcrumb {
  message: string;
  category: string;
  data?: any;
  level?: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  timestamp?: Date;
}

class CrashReporter {
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs = 100;
  private userContext: { id?: string; email?: string } = {};
  private globalContext: Record<string, any> = {};

  /**
   * Initialize the crash reporter
   * This will be called once when the app starts
   */
  initialize() {
    // Set up global error handlers
    if (!__DEV__) {
      // In production, catch unhandled promise rejections
      const originalHandler = global.onunhandledrejection;
      global.onunhandledrejection = (event: any) => {
        this.captureException(
          new Error(`Unhandled Promise Rejection: ${event.reason}`),
          {
            context: 'unhandled_promise_rejection',
            errorInfo: { reason: event.reason },
          }
        );
        if (originalHandler) {
          originalHandler(event);
        }
      };
    }

    console.log('[CrashReporter] Initialized (using console.error until Sentry is integrated)');
  }

  /**
   * Capture an exception with optional context
   */
  captureException(error: Error, context?: CrashReporterContext) {
    const errorData = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      breadcrumbs: this.breadcrumbs.slice(-20), // Last 20 breadcrumbs
      user: this.userContext,
      globalContext: this.globalContext,
      ...context,
    };

    // TODO: Send to Sentry when integrated
    // For now, log to console
    console.error('[CrashReporter] Exception captured:', errorData);

    // In dev, also log the original error for better debugging
    if (__DEV__) {
      console.error('[CrashReporter] Original error:', error);
    }
  }

  /**
   * Capture a message with optional level
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    const messageData = {
      message,
      level,
      timestamp: new Date().toISOString(),
      breadcrumbs: this.breadcrumbs.slice(-20),
      user: this.userContext,
      globalContext: this.globalContext,
    };

    // TODO: Send to Sentry when integrated
    console.log(`[CrashReporter] Message captured (${level}):`, messageData);
  }

  /**
   * Set user context for error reports
   */
  setUser(user: { id: string; email?: string } | null) {
    if (user) {
      this.userContext = { id: user.id, email: user.email };
    } else {
      this.userContext = {};
    }
  }

  /**
   * Set global context that will be included with all reports
   */
  setContext(key: string, value: any) {
    this.globalContext[key] = value;
  }

  /**
   * Add a breadcrumb for debugging context
   */
  addBreadcrumb(breadcrumb: Breadcrumb) {
    this.breadcrumbs.push({
      ...breadcrumb,
      timestamp: breadcrumb.timestamp || new Date(),
    });

    // Keep only the last N breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }
  }

  /**
   * Clear all breadcrumbs
   */
  clearBreadcrumbs() {
    this.breadcrumbs = [];
  }
}

// Create singleton instance
const crashReporterInstance = new CrashReporter();

// Export functions for easy usage
export const initializeCrashReporter = () => crashReporterInstance.initialize();

export const crashReporter = {
  captureException: (error: Error, context?: CrashReporterContext) => 
    crashReporterInstance.captureException(error, context),
  captureMessage: (message: string, level?: 'info' | 'warning' | 'error') => 
    crashReporterInstance.captureMessage(message, level),
  setUser: (user: { id: string; email?: string } | null) => 
    crashReporterInstance.setUser(user),
  setContext: (key: string, value: any) => 
    crashReporterInstance.setContext(key, value),
  addBreadcrumb: (breadcrumb: Breadcrumb) => 
    crashReporterInstance.addBreadcrumb(breadcrumb),
};