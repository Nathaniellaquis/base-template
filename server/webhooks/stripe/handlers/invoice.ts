import Stripe from 'stripe';
import { updateUserSubscriptionStatus } from '@/services/stripe/user-sync/update-user-subscription';
import { createLogger } from '@/utils/logging/logger';
import { lookupUserByCustomerId } from '@/services/stripe/utilities/lookup-user';
import { webhookSuccess, webhookError } from '@/services/stripe/utilities/webhook-response';
import { extractSubscriptionId } from '@/services/stripe/utilities/extract-subscription-id';
import { WebhookHandlerResult } from '../types';

const logger = createLogger('Stripe:InvoiceHandler');

/**
 * Handle successful payment
 */
export async function handlePaymentSucceeded(
  event: Stripe.Event,
  invoice: Stripe.Invoice
): Promise<WebhookHandlerResult> {
  try {
    const customerId = invoice.customer as string;
    const inv = invoice as Stripe.Invoice & {
      subscription?: string | Stripe.Subscription | null;
    };
    const subscriptionId = extractSubscriptionId(inv.subscription);
    
    const user = await lookupUserByCustomerId(customerId);
    
    // Update payment status if this is for their active subscription
    if (user._id && user.subscription?.id === subscriptionId) {
      await updateUserSubscriptionStatus(user._id.toString(), 'active');
      logger.info(`Payment succeeded for user ${user._id}`);
    }
    
    return webhookSuccess(
      `Payment processed for user ${user._id}`,
      user._id?.toString()
    );
  } catch (error) {
    logger.error('Error processing payment success:', error);
    return {
      success: false,
      error: error as Error
    };
  }
}

/**
 * Handle failed payment
 */
export async function handlePaymentFailed(
  event: Stripe.Event,
  invoice: Stripe.Invoice
): Promise<WebhookHandlerResult> {
  try {
    const customerId = invoice.customer as string;
    const inv = invoice as Stripe.Invoice & {
      subscription?: string | Stripe.Subscription | null;
    };
    const subscriptionId = extractSubscriptionId(inv.subscription);
    
    const user = await lookupUserByCustomerId(customerId);
    
    // Update subscription status to past_due
    if (user._id && user.subscription?.id === subscriptionId) {
      await updateUserSubscriptionStatus(user._id.toString(), 'past_due');
      logger.warn(`Payment failed for user ${user._id} - marked as past_due`);
    }
    
    return webhookSuccess(
      `Payment failure processed for user ${user._id}`,
      user._id?.toString()
    );
  } catch (error) {
    logger.error('Error processing payment failure:', error);
    return {
      success: false,
      error: error as Error
    };
  }
}

/**
 * Handle payment action required (3D Secure, etc.)
 */
export async function handlePaymentActionRequired(
  event: Stripe.Event,
  invoice: Stripe.Invoice
): Promise<WebhookHandlerResult> {
  try {
    const customerId = invoice.customer as string;
    const user = await lookupUserByCustomerId(customerId);
    
    // Update subscription to indicate action needed
    if (user._id) {
      await updateUserSubscriptionStatus(user._id.toString(), 'incomplete', {
        requiresAction: true
      });
      logger.info(`Payment action required for user ${user._id} - invoice ${invoice.id}`);
    }
    
    return webhookSuccess(
      `Payment action required for user ${user._id}`,
      user._id?.toString()
    );
  } catch (error) {
    logger.error('Error processing payment action required:', error);
    return {
      success: false,
      error: error as Error
    };
  }
}