import type { Stripe } from 'stripe';
import { stripe } from '../stripe-client';

/**
 * Get customer's active subscription
 */
export async function getActiveSubscription(customerId: string): Promise<Stripe.Subscription | null> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    expand: ['data.items.data.price'],
  });

  // Find active or trialing subscription
  const active = subscriptions.data.find(
    sub => sub.status === 'active' || sub.status === 'trialing'
  );

  return active || null;
}