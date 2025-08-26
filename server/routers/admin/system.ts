/**
 * Admin System Router
 * Handles admin operations related to system stats and monitoring
 */

import { router, adminProcedure } from '@/trpc/trpc';
import { AdminStats } from '@shared';
import { getSystemStats } from '@/services/admin/system';

export const adminSystemRouter = router({
  // Get admin stats
  getStats: adminProcedure
    .query(async ({ ctx }) => {
      return getSystemStats();
    }),
});