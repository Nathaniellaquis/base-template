/**
 * Notifications Tokens Router
 * Handles push token registration and management
 */

import { router, protectedProcedure } from '@/trpc/trpc';
import { registerTokenSchema } from '@shared';
import { registerPushToken } from '@/services/notifications/tokens';

export const notificationTokensRouter = router({
  // Register/update push token for a device
  registerToken: protectedProcedure
    .input(registerTokenSchema)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      return registerPushToken(user._id!, {
        token: input.token,
        deviceId: input.deviceId,
        platform: input.platform
      });
    }),
});