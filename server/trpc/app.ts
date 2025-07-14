import * as trpcExpress from '@trpc/server/adapters/express';
import { userRouter } from '../routers/user';
import { createContext } from './context';
import { router } from './trpc';

// Main app router - combines all routers
export const appRouter = router({
    user: userRouter,
});

export type AppRouter = typeof appRouter;

// Express middleware creator
export const createTRPCMiddleware = () =>
    trpcExpress.createExpressMiddleware({
        router: appRouter,
        createContext,
    }); 