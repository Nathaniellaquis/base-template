import { stripe } from '../stripe-client';
import type { Stripe } from 'stripe';

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['customer', 'latest_invoice.payment_intent'],
  });
}