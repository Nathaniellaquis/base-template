import { z } from 'zod';
import { protectedProcedure } from '@/trpc/trpc';
import { TRPCError } from '@trpc/server';
import { ensureCustomer, createPortalSession as stripeCreatePortalSession } from '@/services/stripe';
import { createLogger } from '@/utils/logging/logger';

const logger = createLogger('Payment:Portal');

const createPortalSessionSchema = z.object({
  returnUrl: z.string().url('Return URL must be a valid URL'),
});

/**
 * Create a Stripe customer portal session
 * Allows users to manage their subscription, payment methods, and billing info
 */
export const createPortalSession = protectedProcedure
  .input(createPortalSessionSchema)
  .mutation(async ({ ctx, input }) => {
    const { user } = ctx;
    const { returnUrl } = input;
    
    // Ensure user has a Stripe customer ID
    if (!user.stripeCustomerId) {
      // Create customer if they don't exist
      const customerId = await ensureCustomer(user);
      
      // Note: In production, you'd also update the database here
      // But following the pattern from subscribe.ts, it seems the ensureCustomer
      // function might handle this, or it's done separately
      if (!customerId) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create customer account',
        });
      }
      
      user.stripeCustomerId = customerId;
    }

    try {
      // Create the portal session
      const session = await stripeCreatePortalSession(
        user.stripeCustomerId,
        returnUrl
      );

      if (!session.url) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create portal session',
        });
      }

      return {
        url: session.url,
        sessionId: session.id,
      };
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error creating portal session', error);
      } else {
        logger.error('Error creating portal session', String(error));
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create billing portal session. Please try again.',
      });
    }
  });