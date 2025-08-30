import { protectedProcedure } from '@/trpc/trpc';
import { createWorkspace } from '@/services/workspace';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1).max(50)
});

export const create = protectedProcedure
  .input(createSchema)
  .mutation(async ({ ctx, input }) => {
    return createWorkspace(ctx.user._id!, input.name);
  });