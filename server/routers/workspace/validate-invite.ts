import { z } from 'zod';
import { publicProcedure } from '@/trpc/trpc';
import { validateWorkspaceInvite } from '@/services/workspace/validate-invite';

export const validateInvite = publicProcedure
  .input(
    z.object({
      code: z.string().min(4).max(4).regex(/^\d{4}$/, 'Code must be 4 digits'),
    })
  )
  .query(async ({ input }) => {
    const result = await validateWorkspaceInvite(input.code);
    
    return {
      workspaceId: result.workspaceId,
      workspaceName: result.workspaceName,
      memberCount: result.memberCount,
    };
  });