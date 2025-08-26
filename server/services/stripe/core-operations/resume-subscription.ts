import { stripe } from '../stripe-client';
import type { Stripe } from 'stripe';

/**
 * Resume a canceled subscription
 */
export async function resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}