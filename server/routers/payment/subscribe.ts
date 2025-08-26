import { getUserCollection } from '@/config/mongodb';
import {
  createSubscription,
  ensureCustomer,
  getActiveSubscription,
  getPriceId,
  resumeSubscription,
  updateSubscription,
} from '@/services/stripe';
import { stripe } from '@/services/stripe/stripe-client';
import { protectedProcedure } from '@/trpc/trpc';
import { analytics } from '@/utils/analytics';
import { mongoDocToUser } from '@/utils/database/mongodb';
import { createLogger } from '@/utils/logging/logger';
import type { PlanType } from '@shared';
import { PRICING } from '@shared';
import { TRPCError } from '@trpc/server';
import { ObjectId } from 'mongodb';
import type Stripe from 'stripe';
import { z } from 'zod';

const logger = createLogger('Payment:Subscribe');

const subscribeSchema = z.object({
  plan: z.enum(['basic', 'pro', 'enterprise']),
  period: z.enum(['monthly', 'yearly']).default('monthly'),
  paymentMethodId: z.string().optional(),
});

/**
 * Subscribe to a plan (handles create, update, resume automatically)
 */
export const subscribe = protectedProcedure
  .input(subscribeSchema)
  .mutation(async ({ ctx, input }) => {
    const { user } = ctx;
    const startTime = Date.now();

    try {
      const { plan: targetPlan, period: targetPeriod, paymentMethodId } = input;

      // Get the price ID for this plan/period combo
      const priceId = getPriceId(targetPlan, targetPeriod);
      if (!priceId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid plan or period selected',
        });
      }

      // Ensure customer exists
      const customerId = await ensureCustomer(user);

      // Save customer ID if new
      if (!user.stripeCustomerId) {
        const usersCollection = getUserCollection();
        await usersCollection.updateOne(
          { _id: new ObjectId(user._id) },
          { $set: { stripeCustomerId: customerId } }
        );
      }

      // Check for existing subscription
      const existingSubscription = await getActiveSubscription(customerId);

      if (existingSubscription) {
        // User has subscription - handle update or resume
        const currentPlan = user.subscription?.plan || 'free';
        const currentPeriod = user.subscription?.period || 'monthly';

        // If canceled, resume it first
        if (user.subscription?.cancelAtPeriodEnd) {
          await resumeSubscription(existingSubscription.id);
        }

        // If different plan or period, update it
        if (currentPlan !== targetPlan || currentPeriod !== targetPeriod) {
          const planHierarchy: PlanType[] = ['free', 'basic', 'pro', 'enterprise'];
          const isDowngrade = planHierarchy.indexOf(targetPlan) < planHierarchy.indexOf(currentPlan);

          const subscription = await updateSubscription(
            existingSubscription.id,
            priceId,
            isDowngrade
          );

          // Update cache
          const usersCollection = getUserCollection();
          await usersCollection.updateOne(
            { _id: new ObjectId(user._id) },
            {
              $set: {
                'subscription.plan': targetPlan,
                'subscription.period': targetPeriod,
                'subscription.priceId': priceId,
                'subscription.cancelAtPeriodEnd': false,
                'subscription.lastSyncedAt': new Date(),
              }
            }
          );

          const sub = subscription as Stripe.Subscription & {
            current_period_end: number;
          };
          // Return updated user with subscription info
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
            action: isDowngrade ? 'downgraded' as const : 'upgraded' as const,
            plan: targetPlan,
            period: targetPeriod,
            effectiveDate: isDowngrade ? new Date(sub.current_period_end * 1000) : 'immediate',
          };
        }

        // Return updated user
        const usersCollectionForResume = getUserCollection();
        const updatedUserDoc = await usersCollectionForResume.findOne({
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
          action: 'resumed' as const,
          plan: currentPlan,
          period: currentPeriod,
        };
      }

      // Create new subscription
      const subscription = await createSubscription(
        customerId,
        priceId,
        paymentMethodId
      );

      // For subscriptions with trials, Stripe returns a SetupIntent to save the payment method
      // The subscription object has either pending_setup_intent (for trials) or latest_invoice.payment_intent (for immediate payment)
      let clientSecret: string | null = null;
      let intentType: 'setup' | 'payment' = 'payment';

      // Check for setup intent (trial subscriptions)
      if (subscription.pending_setup_intent) {
        const setupIntent = typeof subscription.pending_setup_intent === 'string'
          ? await stripe.setupIntents.retrieve(subscription.pending_setup_intent)
          : subscription.pending_setup_intent as Stripe.SetupIntent;

        clientSecret = setupIntent.client_secret;
        intentType = 'setup';

        logger.info(`Created subscription with trial - SetupIntent: ${setupIntent.id}`);
      }
      // Check for payment intent (immediate payment subscriptions)
      else if (subscription.latest_invoice) {
        const invoice = typeof subscription.latest_invoice === 'string'
          ? await stripe.invoices.retrieve(subscription.latest_invoice, { expand: ['payment_intent'] })
          : subscription.latest_invoice as Stripe.Invoice;

        if ((invoice as any).payment_intent && typeof (invoice as any).payment_intent === 'object') {
          clientSecret = (invoice as any).payment_intent.client_secret;
          intentType = 'payment';
          logger.info(`Created subscription with immediate payment - PaymentIntent: ${(invoice as any).payment_intent.id}`);
        }
      }

      if (!clientSecret) {
        logger.error('No client secret found in subscription', {
          hasSetupIntent: !!subscription.pending_setup_intent,
          hasInvoice: !!subscription.latest_invoice,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create payment or setup intent',
        });
      }

      // Create ephemeral key for frontend
      const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: customerId },
        { apiVersion: '2023-10-16' }
      );

      // Update user in database with new subscription
      const usersCollection = getUserCollection();
      await usersCollection.updateOne(
        { _id: new ObjectId(user._id) },
        {
          $set: {
            'subscription.status': subscription.status,
            'subscription.plan': targetPlan,
            'subscription.period': targetPeriod,
            'subscription.stripeSubscriptionId': subscription.id,
            'subscription.priceId': priceId,
            'subscription.cancelAtPeriodEnd': false,
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

      const result = {
        user: mongoDocToUser(updatedUserDoc),
        action: 'created' as const,
        subscriptionId: subscription.id,
        clientSecret,
        customerId,
        ephemeralKey: ephemeralKey.secret,
        amount: PRICING[targetPlan][targetPeriod],
        plan: targetPlan,
        period: targetPeriod,
        intentType, // 'setup' for trials, 'payment' for immediate charges
      };

      // Track successful subscription
      if (user._id) {
        analytics.trackPayment({
          userId: user._id,
          event: 'subscription_created',
          plan: targetPlan,
          amount: PRICING[targetPlan][targetPeriod],
          currency: 'USD',
        });
      }

      logger.info(`Subscription created for user ${user._id}: ${targetPlan} (${targetPeriod})`);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Track payment error
      if (user._id) {
        analytics.trackPayment({
          userId: user._id,
          event: 'payment_failed',
          plan: input.plan,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      analytics.trackError(error, {
        userId: user._id,
        procedure: 'payment.subscribe',
        plan: input.plan,
        period: input.period,
        duration,
      });

      if (error instanceof Error) {
        logger.error(`Subscription failed for user ${user._id}:`, error);
      } else {
        logger.error(`Subscription failed for user ${user._id}:`, String(error));
      }

      throw error;
    }
  });