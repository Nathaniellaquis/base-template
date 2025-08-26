import { stripe } from '../stripe-client';
import type { Stripe } from 'stripe';

/**
 * Create a setup intent for adding payment methods
 */
export async function createSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
  return stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
    usage: 'off_session',
  });
}