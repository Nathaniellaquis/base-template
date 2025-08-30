import { z } from 'zod';
import { protectedProcedure } from '@/trpc/trpc';
import { joinWorkspaceWithInvite } from '@/services/workspace/join-with-invite';

export const joinWithInvite = protectedProcedure
  .input(
    z.object({
      code: z.string().min(4).max(4).regex(/^\d{4}$/, 'Code must be 4 digits'),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const workspace = await joinWorkspaceWithInvite({
      userId: ctx.user._id!,
      code: input.code,
    });

    return {
      workspace: {
        id: workspace._id,
        name: workspace.name,
        role: 'member', // New members always join as 'member'
      },
    };
  });