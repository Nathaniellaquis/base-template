import { findUserByStripeCustomerId } from '../user-sync/update-user-subscription';
import type { User } from '@shared';

/**
 * Lookup user by Stripe customer ID
 * Throws error if user not found - stripeCustomerId should always work
 */
export async function lookupUserByCustomerId(customerId: string): Promise<User> {
  const user = await findUserByStripeCustomerId(customerId);
  
  if (!user) {
    throw new Error(`User not found for customer ${customerId}`);
  }
  
  return user;
}