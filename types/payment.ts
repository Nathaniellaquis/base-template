/**
 * Payment and Subscription Types
 * Shared between frontend and backend
 */

import { z } from 'zod';

// ======= Core Types =======

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'unpaid' | 'paused' | 'none';
export type PlanType = 'free' | 'basic' | 'pro' | 'enterprise';
export type BillingPeriod = 'monthly' | 'yearly';

export interface Subscription {
  id?: string;
  status: SubscriptionStatus;
  plan: PlanType;
  period: BillingPeriod;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  priceId?: string;
  productId?: string;
  lastSyncedAt?: Date;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'apple_pay' | 'google_pay';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}


// ======= Zod Schemas =======

export const createSubscriptionSchema = z.object({
  priceId: z.string(),
  paymentMethodId: z.string().optional(),
});

export const cancelSubscriptionSchema = z.object({
  immediate: z.boolean().default(false),
});

export const updatePaymentMethodSchema = z.object({
  paymentMethodId: z.string(),
});

// ======= Payment Context Types =======

export interface PaymentContextType {
  // Current state
  plan: PlanType;
  period: BillingPeriod;
  isSubscriptionLoading: boolean;

  // Actions
  subscribe: (plan: PlanType, period?: BillingPeriod) => Promise<SubscribeResult>;
  cancel: () => Promise<void>;
  openBilling: () => Promise<void>;
  requirePlan: (minPlan: PlanType, feature?: string) => boolean;
}

export interface SubscribeResult {
  action: string;
  plan: PlanType;
  period?: BillingPeriod;
  subscriptionId?: string;
  clientSecret?: string;
  effectiveDate?: string | Date;
  customerId?: string;
  ephemeralKey?: string;
  paymentIntentId?: string;
  amount?: number;
  user?: any; // Can be more specific if needed
  intentType?: 'setup' | 'payment'; // Indicates whether SetupIntent (trial) or PaymentIntent (immediate charge)
}

// ======= API Response Types =======

export interface CreateSubscriptionResponse {
  subscriptionId: string;
  clientSecret: string;
  status: SubscriptionStatus;
}

export interface CreateSetupIntentResponse {
  clientSecret: string;
  setupIntentId: string;
  customerId?: string;
}

export interface CustomerPortalResponse {
  url: string;
}

// ======= Stripe Webhook Events =======

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

// ======= Pricing Configuration =======

export const PRICING = {
  basic: {
    monthly: 9.99,
    yearly: 99.99,  // ~17% discount
    savings: '2 months free',
  },
  pro: {
    monthly: 29.99,
    yearly: 299.99, // ~17% discount
    savings: '2 months free',
  },
  enterprise: {
    monthly: 99.99,
    yearly: 999.99, // ~17% discount
    savings: '2 months free',
  },
} as const;

// Price IDs moved to server/config/stripe.ts
// This ensures shared types remain environment-agnostic

// ======= Plan Limits (for display purposes only) =======

export const PLAN_LIMITS = {
  free: {
    projects: 3,
    teamMembers: 1,
    storage: 1, // GB
    analyticsRetention: 7, // days
  },
  basic: {
    projects: 10,
    teamMembers: 3,
    storage: 10,
    analyticsRetention: 30,
  },
  pro: {
    projects: 50,
    teamMembers: 10,
    storage: 100,
    analyticsRetention: 90,
  },
  enterprise: {
    projects: -1, // Unlimited
    teamMembers: -1, // Unlimited
    storage: -1, // Unlimited
    analyticsRetention: 365,
  },
} as const;