import { protectedProcedure, router } from '@/trpc/trpc';
import { TRPCError } from '@trpc/server';

/**
 * Stub router for when workspaces are disabled
 * Returns NOT_IMPLEMENTED errors for all operations
 */
export const workspaceRouterStub = router({
  list: protectedProcedure.query(async () => {
    throw new TRPCError({
      code: 'NOT_IMPLEMENTED',
      message: 'Workspaces feature is disabled',
    });
  }),

  create: protectedProcedure.mutation(async () => {
    throw new TRPCError({
      code: 'NOT_IMPLEMENTED',
      message: 'Workspaces feature is disabled',
    });
  }),

  switch: protectedProcedure.mutation(async () => {
    throw new TRPCError({
      code: 'NOT_IMPLEMENTED',
      message: 'Workspaces feature is disabled',
    });
  }),

  invite: protectedProcedure.mutation(async () => {
    throw new TRPCError({
      code: 'NOT_IMPLEMENTED',
      message: 'Workspaces feature is disabled',
    });
  }),
});