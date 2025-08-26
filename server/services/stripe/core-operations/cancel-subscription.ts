import { stripe } from '../stripe-client';
import type { Stripe } from 'stripe';

/**
 * Cancel a subscription (at period end or immediately)
 */
export async function cancelSubscription(
  subscriptionId: string,
  immediate: boolean = false
): Promise<Stripe.Subscription> {
  if (immediate) {
    return stripe.subscriptions.cancel(subscriptionId);
  }
  
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}