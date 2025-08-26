/**
 * Stripe Configuration
 * Server-side only configuration for Stripe integration
 */

import { PlanType, BillingPeriod } from '@shared';
import { config } from '@/config';

// Price IDs from centralized config
export const STRIPE_PRICE_IDS = {
  basic_monthly: config.stripe.prices.basic.monthly,
  basic_yearly: config.stripe.prices.basic.yearly,
  pro_monthly: config.stripe.prices.pro.monthly,
  pro_yearly: config.stripe.prices.pro.yearly,
  enterprise_monthly: config.stripe.prices.enterprise.monthly,
  enterprise_yearly: config.stripe.prices.enterprise.yearly,
} as const;

// Map price IDs to plan types for validation
export const PRICE_ID_TO_PLAN_MAP: Record<string, { plan: PlanType; period: BillingPeriod }> = {
  [STRIPE_PRICE_IDS.basic_monthly]: { plan: 'basic', period: 'monthly' },
  [STRIPE_PRICE_IDS.basic_yearly]: { plan: 'basic', period: 'yearly' },
  [STRIPE_PRICE_IDS.pro_monthly]: { plan: 'pro', period: 'monthly' },
  [STRIPE_PRICE_IDS.pro_yearly]: { plan: 'pro', period: 'yearly' },
  [STRIPE_PRICE_IDS.enterprise_monthly]: { plan: 'enterprise', period: 'monthly' },
  [STRIPE_PRICE_IDS.enterprise_yearly]: { plan: 'enterprise', period: 'yearly' },
};

// Helper function to get price ID from plan and period
export function getPriceId(plan: PlanType, period: BillingPeriod): string | null {
  if (plan === 'free') return null;
  
  const key = `${plan}_${period}` as keyof typeof STRIPE_PRICE_IDS;
  return STRIPE_PRICE_IDS[key] || null;
}

// Helper function to get plan info from price ID
export function getPlanFromPriceId(priceId: string): { plan: PlanType; period: BillingPeriod } | null {
  return PRICE_ID_TO_PLAN_MAP[priceId] || null;
}

// Webhook configuration
export const STRIPE_WEBHOOK_EVENTS = {
  CHECKOUT_SESSION_COMPLETED: 'checkout.session.completed',
  CUSTOMER_SUBSCRIPTION_CREATED: 'customer.subscription.created',
  CUSTOMER_SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  CUSTOMER_SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  INVOICE_PAYMENT_SUCCEEDED: 'invoice.payment_succeeded',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
  PAYMENT_METHOD_ATTACHED: 'payment_method.attached',
  PAYMENT_METHOD_DETACHED: 'payment_method.detached',
} as const;

// Stripe API configuration
export const STRIPE_CONFIG = {
  apiVersion: '2023-10-16' as const,
  webhookEndpointPath: '/webhooks/stripe',
  customerPortalReturnUrl: config.stripe.urls.portalReturn,
  successUrl: config.stripe.urls.success,
  cancelUrl: config.stripe.urls.cancel,
};