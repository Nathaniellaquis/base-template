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
  plan: z.enum(['basic', 'pro', 'enterprise']),
  period: z.enum(['monthly', 'yearly']),
});

export const cancelSubscriptionSchema = z.object({
  immediate: z.boolean().default(false),
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
  effectiveDate?: string | Date;
  user?: any; // Can be more specific if needed
}

// ======= API Response Types =======

export interface CreateSubscriptionResponse {
  subscriptionId: string;
  status: SubscriptionStatus;
}

export interface CustomerPortalResponse {
  url: string;
}

// ======= RevenueCat Types =======

export interface RevenueCatSubscriptionInfo {
  isActive: boolean;
  plan: PlanType;
  period?: BillingPeriod;
  expiresAt?: Date;
  willRenew?: boolean;
  isInTrialPeriod?: boolean;
  isInGracePeriod?: boolean;
  store?: 'APP_STORE' | 'PLAY_STORE' | 'STRIPE' | 'PROMOTIONAL';
}

export interface RevenueCatPurchaseResult {
  success: boolean;
  customerInfo?: any; // RevenueCat CustomerInfo type
  error?: any; // RevenueCat PurchasesError type
  userCancelled?: boolean;
}

// RevenueCat Entitlement IDs - must match dashboard
export const REVENUECAT_ENTITLEMENTS = {
  FREE: 'free',
  BASIC: 'basic',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const;

export type RevenueCatEntitlementId = typeof REVENUECAT_ENTITLEMENTS[keyof typeof REVENUECAT_ENTITLEMENTS];

// RevenueCat Package Identifiers
export const REVENUECAT_PACKAGES = {
  BASIC_MONTHLY: 'basic_monthly',
  BASIC_YEARLY: 'basic_yearly',
  PRO_MONTHLY: 'pro_monthly',
  PRO_YEARLY: 'pro_yearly',
  ENTERPRISE_MONTHLY: 'enterprise_monthly',
  ENTERPRISE_YEARLY: 'enterprise_yearly',
} as const;

// ======= Pricing Configuration =======

export const PRICING = {
  basic: {
    monthly: 4.99,
    yearly: 49.99,  // ~17% discount
    yearlyMonthly: 4.17, // Yearly price divided by 12
    savings: '2 months free',
  },
  pro: {
    monthly: 9.99,
    yearly: 99.99, // ~17% discount
    yearlyMonthly: 8.33,
    savings: '2 months free',
  },
  enterprise: {
    monthly: 19.99,
    yearly: 199.99, // ~17% discount
    yearlyMonthly: 16.67,
    savings: '2 months free',
  },
} as const;

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