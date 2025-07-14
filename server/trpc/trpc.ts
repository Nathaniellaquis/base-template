import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { type Context } from './context';

// Initialize tRPC
const t = initTRPC.context<Context>().create({
    transformer: superjson,
    errorFormatter({ shape }) {
        return shape;
    },
});

// Export router and procedure creators
export const router = t.router;
export const procedure = t.procedure;

// Auth middleware
const isAuthenticated = t.middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
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

// Pre-configured procedures
export const publicProcedure = procedure;
export const protectedProcedure = procedure.use(isAuthenticated); 