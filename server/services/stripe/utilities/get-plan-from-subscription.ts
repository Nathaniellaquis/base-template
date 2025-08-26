import { getPlanFromPriceId } from './get-plan-from-price-id';
import type { Stripe } from 'stripe';
import type { PlanType, BillingPeriod } from '@shared';

/**
 * Extract plan and period from a Stripe subscription
 */
export function getPlanFromSubscription(subscription: Stripe.Subscription): {
  plan: PlanType;
  period: BillingPeriod;
} {
  if (!subscription.items.data.length) {
    return { plan: 'free', period: 'monthly' };
  }

  const priceId = subscription.items.data[0].price.id;
  const plan = getPlanFromPriceId(priceId);
  
  // Determine period from price interval
  const interval = subscription.items.data[0].price.recurring?.interval;
  const period: BillingPeriod = interval === 'year' ? 'yearly' : 'monthly';

  return { plan, period };
}