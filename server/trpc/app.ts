import { onboardingRouter } from '@/routers/onboarding/index';
import { userRouter } from '@/routers/user';
import { notificationsRouter } from '@/routers/notifications';
import { adminRouter } from '@/routers/admin';
import { paymentRouter } from '@/routers/payment';
import { experimentRouter } from '@/routers/experiment';
import * as trpcExpress from '@trpc/server/adapters/express';
import { createContext } from './context';
import { router } from './trpc';

// Main app router - combines all routers
export const appRouter = router({
    user: userRouter,
    onboarding: onboardingRouter,
    notifications: notificationsRouter,
    admin: adminRouter,
    payment: paymentRouter,
    experiment: experimentRouter,
});

export type AppRouter = typeof appRouter;

// Express middleware creator
export const createTRPCMiddleware = () =>
    trpcExpress.createExpressMiddleware({
        router: appRouter,
        createContext,
    }); 