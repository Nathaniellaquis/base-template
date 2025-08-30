import { z } from 'zod';
import { protectedProcedure } from '@/trpc/trpc';
import { generateWorkspaceInvite } from '@/services/workspace/generate-invite';

export const generateInvite = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
      expiresInDays: z.number().min(1).max(30).default(7),
      maxUses: z.number().min(1).optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const invite = await generateWorkspaceInvite({
      workspaceId: input.workspaceId,
      userId: ctx.user._id!,
      expiresInDays: input.expiresInDays,
      maxUses: input.maxUses,
    });

    return {
      code: invite.code,
      expiresAt: invite.expiresAt,
      maxUses: invite.maxUses,
      workspaceId: invite.workspaceId,
    };
  });