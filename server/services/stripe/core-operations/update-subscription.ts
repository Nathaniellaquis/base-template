import { stripe } from '../stripe-client';
import type { Stripe } from 'stripe';

/**
 * Update subscription (upgrade/downgrade)
 */
export async function updateSubscription(
  subscriptionId: string,
  newPriceId: string,
  isDowngrade: boolean = false
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  // For downgrades, schedule the change at period end to avoid refunds
  // For upgrades, change immediately with proration
  if (isDowngrade) {
    // Schedule downgrade at period end
    return stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'none',
      billing_cycle_anchor: 'unchanged',
      // This schedules the change for the next billing cycle
      cancel_at_period_end: false,
      trial_end: 'now',
    });
  } else {
    // Immediate upgrade with proration
    return stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'always_invoice',
    });
  }
}