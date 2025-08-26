import type { Stripe } from 'stripe';
import { stripe } from '../stripe-client';

/**
 * Create a subscription with best practices for trials
 * 
 * For subscriptions with trials:
 * - payment_behavior: 'default_incomplete' creates a SetupIntent for authentication
 * - This allows SCA/3DS authentication during trial signup
 * - For Apple Pay, this consumes the cryptogram immediately (prevents expiration)
 * - save_default_payment_method: 'on_subscription' automatically saves the payment method
 */
export async function createSubscription(
  customerId: string,
  priceId: string,
  paymentMethodId?: string
): Promise<Stripe.Subscription> {
  const subscriptionData: Stripe.SubscriptionCreateParams = {
    customer: customerId,
    items: [{ price: priceId }],
    // 'default_incomplete' is best for trials - creates SetupIntent for auth
    payment_behavior: 'default_incomplete',
    payment_settings: {
      // Automatically save payment method when subscription starts
      save_default_payment_method: 'on_subscription',
      // Accept card payments (includes Apple Pay/Google Pay)
      payment_method_types: ['card'],
    },
    expand: ['latest_invoice.payment_intent', 'pending_setup_intent'],
    trial_period_days: 14, // Configurable
    metadata: {
      environment: process.env.NODE_ENV || 'development',
    },
  };

  if (paymentMethodId) {
    subscriptionData.default_payment_method = paymentMethodId;
  }

  return stripe.subscriptions.create(subscriptionData);
}