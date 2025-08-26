/**
 * Admin Users Router
 * Handles admin operations related to user management
 */

import { router, adminProcedure } from '@/trpc/trpc';
import { 
  getAllUsersSchema,
  updateUserRoleSchema
} from '@shared';
import {
  getAllUsers,
  updateUserRole
} from '@/services/admin/user-management';

export const adminUsersRouter = router({
  // Get all users
  getAllUsers: adminProcedure
    .input(getAllUsersSchema)
    .query(async ({ ctx, input }) => {
      return getAllUsers({
        limit: input.limit,
        skip: input.skip,
        search: input.search
      });
    }),
  
  // Promote user to admin
  promoteToAdmin: adminProcedure
    .input(updateUserRoleSchema)
    .mutation(async ({ ctx, input }) => {
      // Don't allow self-demotion
      if (input.userId === ctx.user._id && input.role === 'user') {
        throw new Error('Cannot demote yourself');
      }
      
      return updateUserRole(ctx.user._id!, input.userId, input.role);
    }),
});