import Stripe from 'stripe';

/**
 * Extract subscription ID from various Stripe subscription formats
 * Handles string | Stripe.Subscription | null | undefined
 */
export function extractSubscriptionId(
  subscription: string | Stripe.Subscription | null | undefined
): string | undefined {
  if (!subscription) {
    return undefined;
  }
  
  return typeof subscription === 'string' ? subscription : subscription.id;
}