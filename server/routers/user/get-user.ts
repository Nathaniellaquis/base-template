import { protectedProcedure } from '../../trpc/trpc';

export const getUser = protectedProcedure.query(async ({ ctx }) => {
    // We already have the full user in context!
    // This is super fast - no DB query needed
    return ctx.user;
}); 