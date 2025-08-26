import { stripe } from '../stripe-client';
import type { Stripe } from 'stripe';

/**
 * Get customer's payment methods
 */
export async function getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });
  
  return paymentMethods.data;
}