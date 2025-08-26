import { protectedProcedure } from '@/trpc/trpc';
import { getActiveSubscription, getPlanFromSubscription } from '@/services/stripe';
import { getUserCollection } from '@/config/mongodb';
import { ObjectId } from 'mongodb';
import { createLogger } from '@/utils/logging/logger';
import type Stripe from 'stripe';
import type { PlanType, BillingPeriod } from '@shared/payment';
import type { User } from '@shared';

const logger = createLogger('Payment:GetSubscription');

/**
 * Get current subscription status
 */
export const getSubscription = protectedProcedure.query(async ({ ctx }) => {
  const { user } = ctx;
  
  // Return cached subscription data
  if (user.subscription) {
    // Check if cache is fresh (< 5 minutes old)
    const cacheAge = Date.now() - new Date(user.subscription.lastSyncedAt).getTime();
    if (cacheAge < 5 * 60 * 1000) {
      return {
        subscription: user.subscription,
        plan: user.subscription.plan,
      };
    }
  }

  // No Stripe customer yet
  if (!user.stripeCustomerId) {
    return {
      subscription: {
        status: 'none' as const,
        plan: 'free' as PlanType,
        period: 'monthly' as BillingPeriod,
        cancelAtPeriodEnd: false,
      },
      plan: 'free' as PlanType,
    };
  }

  // Fetch fresh data from Stripe
  try {
    const stripeSubscription = await getActiveSubscription(user.stripeCustomerId);
    
    if (!stripeSubscription) {
      return {
        subscription: {
          status: 'none' as const,
          plan: 'free' as PlanType,
          period: 'monthly' as BillingPeriod,
          cancelAtPeriodEnd: false,
        },
        plan: 'free' as PlanType,
      };
    }

    // Update cache
    const { plan, period } = getPlanFromSubscription(stripeSubscription);
    // TypeScript doesn't recognize all Stripe.Subscription properties
    // We know these exist from the Stripe API documentation
    const sub = stripeSubscription as Stripe.Subscription & {
      current_period_end: number;
    };
    // Define the subscription data type explicitly
    type UserSubscription = NonNullable<User['subscription']>;
    const subscriptionData: UserSubscription = {
      id: sub.id,
      status: sub.status as UserSubscription['status'],
      plan,
      period,
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      priceId: sub.items.data[0].price.id,
      productId: sub.items.data[0].price.product as string,
      lastSyncedAt: new Date(),
    };

    const usersCollection = getUserCollection();
    await usersCollection.updateOne(
      { _id: new ObjectId(user._id) },
      { $set: { subscription: subscriptionData } }
    );

    return {
      subscription: subscriptionData,
      plan,
    };
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Error fetching subscription', error);
    } else {
      logger.error('Error fetching subscription', String(error));
    }
    return {
      subscription: {
        status: 'none' as const,
        plan: 'free' as PlanType,
        period: 'monthly' as BillingPeriod,
        cancelAtPeriodEnd: false,
      },
      plan: 'free' as PlanType,
    };
  }
});