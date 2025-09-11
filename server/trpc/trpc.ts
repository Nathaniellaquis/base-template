import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { type Context } from './context';
import { createLogger } from '@/utils/logging/logger';
import { serverLogger } from '@/utils/analytics';

const logger = createLogger('TRPC');

// Initialize tRPC with error tracking
const t = initTRPC.context<Context>().create({
    transformer: superjson,
    errorFormatter({ shape, error, type, path, input, ctx }) {
        // Track tRPC errors
        if (ctx) {
            serverLogger.logError(error, {
                userId: ctx.user?._id,
                procedure: path,
                type,
                input: input,
                code: shape.data?.code,
            });
        }
        
        // Log error
        if (error instanceof Error) {
            logger.error(`tRPC Error in ${path}:`, error);
        } else {
            logger.error(`tRPC Error in ${path}:`, String(error));
        }
        
        return shape;
    },
});

// Export router and procedure creators
export const router = t.router;
export const procedure = t.procedure;

// Logging and error tracking middleware
const logRequests = t.middleware(async ({ ctx, next, path, type }) => {
    const start = Date.now();
    const userId = ctx.user?._id || 'anonymous';
    const userUid = ctx.user?.uid || 'none';

    logger.info(`${type.toUpperCase()} ${path} - User: ${userId} (${userUid})`);

    try {
        const middlewareResponse = await next();
        
        const duration = Date.now() - start;
        
        // Only log slow procedures
        if (duration > 3000) {
            logger.warn(`Slow procedure: ${type.toUpperCase()} ${path} took ${duration}ms`);
            serverLogger.logSlowRequest({
                userId: ctx.user?._id,
                path: `trpc/${path}`,
                method: type.toUpperCase(),
                statusCode: 200,
                duration,
            });
        } else {
            logger.debug(`${type.toUpperCase()} ${path} - Completed in ${duration}ms`);
        }
        
        return middlewareResponse;
    } catch (error) {
        const duration = Date.now() - start;
        
        // Track failed procedure execution
        serverLogger.logFailedProcedure({
            userId: ctx.user?._id,
            procedure: path,
            duration,
            error: error instanceof Error ? error.message : String(error),
        });
        
        // Log additional details for debugging
        logger.error(`Failed ${type} procedure: ${path}`, error);
        
        throw error;
    }
});

// Auth middleware with failure tracking
const isAuthenticated = t.middleware(async ({ ctx, next, path }) => {
    if (!ctx.user) {
        // Track unauthorized access attempts
        serverLogger.logAuthFailure({
            reason: 'No valid user session',
            path: `trpc/${path}`,
        });
        
        // Log additional details for debugging
        logger.warn('Unauthorized access attempt', { event: 'unauthorized_access', path });
        
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You must be logged in',
        });
    }

    return next({
        ctx: {
            ...ctx,
            user: ctx.user,
        },
    });
});

// Admin middleware with security tracking
const isAdmin = t.middleware(async ({ ctx, next, path }) => {
    if (!ctx.user || ctx.user.role !== 'admin') {
        // Track admin access violations (important security event)
        serverLogger.logAuthFailure({
            userId: ctx.user?._id,
            reason: ctx.user ? `User role: ${ctx.user.role}` : 'No user session',
            path: `trpc/${path}`,
        });
        
        // Log additional details for debugging
        logger.warn('Admin access denied', { event: 'admin_access_denied', userId: ctx.user?._id, path });
        
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Admin access required',
        });
    }
    
    return next({
        ctx: {
            ...ctx,
            user: ctx.user, // We know user exists and is admin
        },
    });
});

// Pre-configured procedures
export const publicProcedure = procedure.use(logRequests);
export const protectedProcedure = procedure.use(logRequests).use(isAuthenticated);
export const adminProcedure = procedure.use(logRequests).use(isAuthenticated).use(isAdmin); 