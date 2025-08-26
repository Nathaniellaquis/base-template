import { protectedProcedure } from '@/trpc/trpc';
import { TRPCError } from '@trpc/server';
import { cancelSubscription } from '@/services/stripe';
import { getUserCollection } from '@/config/mongodb';
import { ObjectId } from 'mongodb';
import { createLogger } from '@/utils/logging/logger';
import { mongoDocToUser } from '@/utils/database/mongodb';
import type { User } from '@shared';

const logger = createLogger('Payment:Cancel');

/**
 * Cancel subscription at period end
 */
export const cancel = protectedProcedure.mutation(async ({ ctx }) => {
  const { user } = ctx;
  
  // Check if user has Stripe customer
  if (!user.stripeCustomerId) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'No active subscription found',
    });
  }

  // Check if user has active subscription
  if (!user.subscription || !user.subscription.id) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'No active subscription to cancel',
    });
  }

  // Check if already canceled
  if (user.subscription.cancelAtPeriodEnd) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Subscription is already scheduled for cancellation',
    });
  }

  try {
    // Cancel subscription at period end via Stripe
    const canceledSubscription = await cancelSubscription(
      user.subscription.id,
      false // cancel at period end, not immediately
    );

    // Update database
    const usersCollection = getUserCollection();
    await usersCollection.updateOne(
      { _id: new ObjectId(user._id) },
      { 
        $set: { 
          'subscription.cancelAtPeriodEnd': true,
          'subscription.status': canceledSubscription.status,
          'subscription.lastSyncedAt': new Date(),
        }
      }
    );

    // Return updated user
    const updatedUserDoc = await usersCollection.findOne({
      _id: new ObjectId(user._id)
    });
    
    if (!updatedUserDoc) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch updated user',
      });
    }
    
    return {
      user: mongoDocToUser(updatedUserDoc),
      success: true,
      message: 'Subscription will be canceled at the end of the current billing period',
      cancelAt: user.subscription.currentPeriodEnd,
      plan: user.subscription.plan,
    };
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Error canceling subscription', error);
    } else {
      logger.error('Error canceling subscription', String(error));
    }
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to cancel subscription. Please try again or contact support.',
    });
  }
});