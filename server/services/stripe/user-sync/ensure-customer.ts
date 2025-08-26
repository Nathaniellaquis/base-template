import { stripe } from '../stripe-client';
import { createCustomer } from '../core-operations/create-customer';
import { User } from '@shared';

/**
 * Get or create a Stripe customer
 */
export async function ensureCustomer(user: User): Promise<string> {
  if (user.stripeCustomerId) {
    // Verify customer exists
    try {
      await stripe.customers.retrieve(user.stripeCustomerId);
      return user.stripeCustomerId;
    } catch (error) {
      // Customer doesn't exist, create new one
    }
  }

  // Create new customer
  const customer = await createCustomer(user);
  
  // Update user with customer ID (done in router)
  return customer.id;
}