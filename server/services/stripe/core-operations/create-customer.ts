import { stripe } from '../stripe-client';
import { User } from '@shared';
import type { Stripe } from 'stripe';

/**
 * Create a new Stripe customer
 */
export async function createCustomer(user: User): Promise<Stripe.Customer> {
  return stripe.customers.create({
    email: user.email,
    metadata: {
      mongoId: user._id!.toString(),
      firebaseUid: user.uid,
      environment: process.env.NODE_ENV || 'development',
    },
  });
}