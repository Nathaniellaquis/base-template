/**
 * Notifications Preferences Router
 * Handles user notification preferences
 */

import { router, protectedProcedure } from '@/trpc/trpc';
import { updatePreferencesSchema } from '@shared';
import { updateNotificationPreferences } from '@/services/notifications/preferences';

export const notificationPreferencesRouter = router({
  // Update notification preferences
  updatePreferences: protectedProcedure
    .input(updatePreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      return updateNotificationPreferences(user._id!, input);
    }),
});