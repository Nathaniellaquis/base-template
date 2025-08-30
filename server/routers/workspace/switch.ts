import { protectedProcedure } from '@/trpc/trpc';
import { switchWorkspace } from '@/services/workspace';
import { z } from 'zod';

const switchSchema = z.object({
  workspaceId: z.string()
});

export const switchRoute = protectedProcedure
  .input(switchSchema)
  .mutation(async ({ ctx, input }) => {
    return switchWorkspace(ctx.user._id!, input.workspaceId);
  });