import Stripe from 'stripe';
import { updateUserSubscription } from '@/services/stripe/user-sync/update-user-subscription';
import { createLogger } from '@/utils/logging/logger';
import { lookupUserByCustomerId } from '@/services/stripe/utilities/lookup-user';
import { webhookSuccess, webhookError } from '@/services/stripe/utilities/webhook-response';
import { WebhookHandlerResult } from '../types';

const logger = createLogger('Stripe:SubscriptionHandler');

/**
 * Handle subscription updates (created, updated)
 */
export async function handleSubscriptionUpdate(
  event: Stripe.Event,
  subscription: Stripe.Subscription
): Promise<WebhookHandlerResult> {
  try {
    const customerId = subscription.customer as string;
    const user = await lookupUserByCustomerId(customerId);
    
    // Update subscription data
    if (user._id) {
      await updateUserSubscription(user._id.toString(), subscription);
      logger.info(`Updated subscription for user ${user._id}: ${subscription.status}`);
    }
    
    return webhookSuccess(
      `Subscription updated for user ${user._id}`,
      user._id?.toString()
    );
  } catch (error) {
    logger.error('Error processing subscription update:', error);
    return {
      success: false,
      error: error as Error
    };
  }
}

/**
 * Handle subscription deletion (cancellation completed)
 */
export async function handleSubscriptionDeleted(
  event: Stripe.Event,
  subscription: Stripe.Subscription
): Promise<WebhookHandlerResult> {
  try {
    const customerId = subscription.customer as string;
    const user = await lookupUserByCustomerId(customerId);
    
    // Clear subscription data
    if (user._id) {
      await updateUserSubscription(user._id.toString(), null);
      logger.info(`Subscription deleted for user ${user._id}`);
    }
    
    return webhookSuccess(
      `Subscription removed for user ${user._id}`,
      user._id?.toString()
    );
  } catch (error) {
    logger.error('Error processing subscription deletion:', error);
    return {
      success: false,
      error: error as Error
    };
  }
}