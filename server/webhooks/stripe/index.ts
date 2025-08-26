import { Request, Response } from 'express';
import Stripe from 'stripe';
import { stripe } from '@/services/stripe';
import { createLogger } from '@/utils/logging/logger';
import { config } from '@/config';

// Import handlers
import { handleCheckoutCompleted } from './handlers/checkout';
import { handleSubscriptionUpdate, handleSubscriptionDeleted } from './handlers/subscription';
import { handlePaymentSucceeded, handlePaymentFailed, handlePaymentActionRequired } from './handlers/invoice';
import { handlePaymentIntentSucceeded, handlePaymentIntentFailed } from './handlers/payment-intent';

const logger = createLogger('StripeWebhook');

/**
 * Main Stripe webhook handler
 * Clean and modular - each event type has its own handler
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  
  if (!sig) {
    return res.status(400).send('No signature');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripe.webhookSecret
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Webhook signature verification failed:', errorMessage);
    return res.status(400).send(`Webhook Error: ${errorMessage}`);
  }

  logger.info(`Processing webhook: ${event.type}`);

  try {
    let result;

    switch (event.type) {
      // Checkout
      case 'checkout.session.completed':
        result = await handleCheckoutCompleted(event, event.data.object as Stripe.Checkout.Session);
        break;

      // Subscriptions
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        result = await handleSubscriptionUpdate(event, event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        result = await handleSubscriptionDeleted(event, event.data.object as Stripe.Subscription);
        break;

      // Invoices
      case 'invoice.payment_succeeded':
        result = await handlePaymentSucceeded(event, event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        result = await handlePaymentFailed(event, event.data.object as Stripe.Invoice);
        break;
        
      case 'invoice.payment_action_required':
        result = await handlePaymentActionRequired(event, event.data.object as Stripe.Invoice);
        break;

      // One-time payments (optional)
      case 'payment_intent.succeeded':
        result = await handlePaymentIntentSucceeded(event, event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'payment_intent.payment_failed':
        result = await handlePaymentIntentFailed(event, event.data.object as Stripe.PaymentIntent);
        break;

      default:
        logger.debug(`Unhandled event type: ${event.type}`);
        result = { success: true, message: 'Event type not handled' };
    }

    if (!result.success) {
      logger.error(`Failed to process ${event.type}:`, result.error || result.message);
    }

    res.json({ received: true, result });
  } catch (error) {
    logger.error('Error processing webhook:', error);
    res.status(500).send('Webhook processing error');
  }
}