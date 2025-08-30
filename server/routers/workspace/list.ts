import { protectedProcedure } from '@/trpc/trpc';
import { listWorkspaces } from '@/services/workspace';

export const list = protectedProcedure
  .query(async ({ ctx }) => {
    return listWorkspaces(ctx.user._id!);
  });