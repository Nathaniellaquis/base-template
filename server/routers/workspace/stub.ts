import { router, protectedProcedure } from '@/trpc/trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

// Define input schemas to match the real router
const createSchema = z.object({
  name: z.string().min(1).max(50)
});

const switchSchema = z.object({
  workspaceId: z.string()
});

/**
 * Stub workspace router for when workspaces are disabled
 * Maintains type compatibility while returning appropriate errors
 */
export const workspaceRouterStub = router({
  list: protectedProcedure.query(async () => {
    throw new TRPCError({
      code: 'NOT_IMPLEMENTED',
      message: 'Workspaces feature is disabled',
    });
  }),

  create: protectedProcedure
    .input(createSchema)
    .mutation(async () => {
      throw new TRPCError({
        code: 'NOT_IMPLEMENTED',
        message: 'Workspaces feature is disabled',
      });
    }),

  switch: protectedProcedure
    .input(switchSchema)
    .mutation(async () => {
      throw new TRPCError({
        code: 'NOT_IMPLEMENTED',
        message: 'Workspaces feature is disabled',
      });
    }),
});