import { stripe } from '../stripe-client';
import type { Stripe } from 'stripe';

/**
 * Construct webhook event from Stripe
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, secret);
}