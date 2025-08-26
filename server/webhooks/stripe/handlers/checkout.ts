import Stripe from 'stripe';
import { stripe } from '@/services/stripe/stripe-client';
import { getUserCollection } from '@/config/mongodb';
import { ObjectId } from 'mongodb';
import { updateUserSubscription } from '@/services/stripe/user-sync/update-user-subscription';
import { createLogger } from '@/utils/logging/logger';
import { lookupUserByCustomerId } from '@/services/stripe/utilities/lookup-user';
import { webhookSuccess, webhookError } from '@/services/stripe/utilities/webhook-response';
import { WebhookHandlerResult } from '../types';

const logger = createLogger('Stripe:CheckoutHandler');

/**
 * Handle checkout.session.completed
 * Process completed checkout sessions and activate subscriptions
 */
export async function handleCheckoutCompleted(
  event: Stripe.Event,
  session: Stripe.Checkout.Session
): Promise<WebhookHandlerResult> {
  try {
    // Get the full session with expansions
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items', 'subscription']
    });
    
    const customerId = fullSession.customer as string;
    const subscriptionId = fullSession.subscription as string;
    
    if (!customerId || !subscriptionId) {
      return webhookError('Invalid session - missing customer or subscription');
    }
    
    // Lookup user by customer ID
    const user = await lookupUserByCustomerId(customerId);
    
    // Get and save subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await updateUserSubscription(user._id!.toString(), subscription);
    
    logger.info(`Checkout completed for user ${user._id}`);
    
    return webhookSuccess(
      `Subscription activated for user ${user._id}`,
      user._id!.toString()
    );
  } catch (error) {
    logger.error('Error processing checkout session:', error);
    return {
      success: false,
      error: error as Error
    };
  }
}

/**
 * Ensure user has Stripe customer ID saved
 */
export async function ensureUserCustomerId(userId: string, customerId: string): Promise<void> {
  const usersCollection = getUserCollection();
  await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { stripeCustomerId: customerId } }
  );
}