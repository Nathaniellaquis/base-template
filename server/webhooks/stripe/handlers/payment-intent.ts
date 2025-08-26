import Stripe from 'stripe';
import { createLogger } from '@/utils/logging/logger';
import { lookupUserByCustomerId } from '@/services/stripe/utilities/lookup-user';
import { webhookSuccess, webhookError } from '@/services/stripe/utilities/webhook-response';
import { WebhookHandlerResult } from '../types';

const logger = createLogger('Stripe:PaymentIntentHandler');

/**
 * Handle successful one-time payment
 */
export async function handlePaymentIntentSucceeded(
  event: Stripe.Event,
  paymentIntent: Stripe.PaymentIntent
): Promise<WebhookHandlerResult> {
  try {
    const customerId = paymentIntent.customer as string;
    
    if (!customerId) {
      logger.info('Payment intent without customer ID - likely a guest payment');
      return webhookSuccess('Guest payment processed');
    }
    
    const user = await lookupUserByCustomerId(customerId);
    logger.info(`One-time payment succeeded for user ${user._id}: $${paymentIntent.amount / 100}`);
    
    // You could add custom logic here for credits, one-time purchases, etc.
    // For example:
    // await addUserCredits(user._id, paymentIntent.metadata.credits);
    
    return webhookSuccess(
      `Payment processed for user ${user._id}`,
      user._id?.toString()
    );
  } catch (error) {
    logger.error('Error processing payment intent success:', error);
    return {
      success: false,
      error: error as Error
    };
  }
}

/**
 * Handle failed one-time payment
 */
export async function handlePaymentIntentFailed(
  event: Stripe.Event,
  paymentIntent: Stripe.PaymentIntent
): Promise<WebhookHandlerResult> {
  try {
    const customerId = paymentIntent.customer as string;
    
    if (!customerId) {
      logger.info('Payment intent failed without customer ID');
      return webhookSuccess('Guest payment failed');
    }
    
    const user = await lookupUserByCustomerId(customerId);
    logger.warn(`One-time payment failed for user ${user._id}: ${paymentIntent.last_payment_error?.message}`);
    
    return webhookSuccess(
      `Payment failure recorded for user ${user._id}`,
      user._id?.toString()
    );
  } catch (error) {
    logger.error('Error processing payment intent failure:', error);
    return {
      success: false,
      error: error as Error
    };
  }
}