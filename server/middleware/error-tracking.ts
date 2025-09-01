/**
 * Error Tracking Middleware for Express
 * Captures and tracks all errors that occur in the application
 */
import { Request, Response, NextFunction } from 'express';
import { serverLogger } from '@/utils/analytics';
import { createLogger } from '@/utils/logging/logger';
import { config } from '@/config';

const logger = createLogger('ErrorTracking');

/**
 * Performance monitoring middleware
 * Only tracks slow requests (negative events)
 */
export function performanceMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  // Store original end function
  const originalEnd = res.end;
  
  // Override end function to track slow requests only
  res.end = function(...args: any[]) {
    // Restore original end function
    res.end = originalEnd;
    
    // Calculate duration
    const duration = Date.now() - startTime;
    
    // Only track if request is slow or failed
    if (duration > 3000 || res.statusCode >= 400) {
      const userId = (req as any).userId || 
                     (req as any).user?._id || 
                     (req as any).auth?.uid ||
                     undefined;
      
      // Track slow request
      if (duration > 3000) {
        serverLogger.logSlowRequest({
          userId,
          path: req.path,
          method: req.method,
          statusCode: res.statusCode,
          duration,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
        });
        
        logger.warn(`Slow request: ${req.method} ${req.path} took ${duration}ms`);
      }
    }
    
    // Call original end function
    return originalEnd.apply(res, args as any);
  };
  
  next();
}

/**
 * Error tracking middleware
 * Must be placed after all other middleware and routes
 */
export function errorTrackingMiddleware(err: Error, req: Request, res: Response, next: NextFunction) {
  // Get request context
  const userId = (req as any).userId || 
                 (req as any).user?._id || 
                 (req as any).auth?.uid ||
                 undefined;
  
  const context = {
    userId,
    path: req.path,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    body: req.body,
    query: req.query,
    params: req.params,
    headers: {
      ...req.headers,
      // Remove sensitive headers
      authorization: undefined,
      cookie: undefined,
    },
  };
  
  // Track the error
  serverLogger.logError(err, context);
  
  // Log the error
  logger.error(`Error in ${req.method} ${req.path}`, err);
  
  // Determine status code
  const statusCode = (err as any).statusCode || (err as any).status || 500;
  
  // Prepare error response
  const errorResponse: any = {
    error: true,
    message: err.message || 'Internal server error',
  };
  
  // In development, include stack trace
  if (config.isDevelopment) {
    errorResponse.stack = err.stack;
    errorResponse.details = err;
  }
  
  // Add request ID if available
  if ((req as any).id) {
    errorResponse.requestId = (req as any).id;
  }
  
  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export function asyncErrorWrapper(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response) {
  // Only track 404s for API routes (not static assets)
  if (req.path.startsWith('/api') || req.path.startsWith('/trpc')) {
    const error = new Error(`Route not found: ${req.method} ${req.path}`);
    (error as any).statusCode = 404;
    
    // Track 404 errors as they might indicate broken integrations
    serverLogger.logError(error, {
      userId: (req as any).userId || undefined,
      path: req.path,
      method: req.method,
      ip: req.ip,
      category: '404',
    });
  }
  
  res.status(404).json({
    error: true,
    message: 'Route not found',
    path: req.path,
    method: req.method,
  });
}

/**
 * Unhandled rejection handler
 */
export function setupUnhandledRejectionTracking() {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Promise Rejection:', reason);
    
    // Track unhandled rejection
    serverLogger.logError(reason, {
      type: 'unhandledRejection',
      promise: String(promise),
    });
  });
  
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);
    
    // Track uncaught exception
    serverLogger.logError(error, {
      type: 'uncaughtException',
      fatal: true,
    });
    
    // Give time for error to be tracked before exiting
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
}