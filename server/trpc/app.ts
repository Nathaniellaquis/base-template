import { onboardingRouter } from '@/routers/onboarding/index';
import { userRouter } from '@/routers/user';
import { notificationsRouter } from '@/routers/notifications';
import { adminRouter } from '@/routers/admin';
import { paymentRouter } from '@/routers/payment';
import { experimentRouter } from '@/routers/experiment';
import { workspaceRouter } from '@/routers/workspace';
import { workspaceRouterStub } from '@/routers/workspace/stub';
import { config } from '@/config';
import * as trpcExpress from '@trpc/server/adapters/express';
import { createContext } from './context';
import { router } from './trpc';

// Use stub when workspaces are disabled
const workspace = config.enableWorkspaces ? workspaceRouter : workspaceRouterStub;

// Main app router - combines all routers
export const appRouter = router({
    user: userRouter,
    onboarding: onboardingRouter,
    notifications: notificationsRouter,
    admin: adminRouter,
    payment: paymentRouter,
    experiment: experimentRouter,
    workspace: workspace,
});

export type AppRouter = typeof appRouter;

// Express middleware creator
export const createTRPCMiddleware = () =>
    trpcExpress.createExpressMiddleware({
        router: appRouter,
        createContext,
    }); 