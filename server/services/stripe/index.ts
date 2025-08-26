/**
 * Stripe Service Layer - Single Export Point
 * 
 * All Stripe functionality is organized into logical groups:
 * - Core Operations: Subscription management, customer operations
 * - User Sync: Database synchronization with Stripe data
 * - Webhook Processing: Handle Stripe webhook events
 * - Utilities: Helper functions and utilities
 */

// Stripe Client Instance
export { stripe } from './stripe-client';

// Core Operations
export {
  createCustomer,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  resumeSubscription,
  getActiveSubscription,
  getSubscription,
  createSetupIntent,
  createPortalSession,
  getPaymentMethods
} from './core-operations';

// User Sync Operations
export {
  updateUserSubscription,
  updateUserSubscriptionStatus,
  updateUserSubscriptionByCustomerId,
  findUserByStripeCustomerId,
  ensureCustomer
} from './user-sync';

// Webhook Processing - Removed (now in webhook handlers directly)

// Utilities
export {
  getPriceId,
  getPlanFromPriceId,
  getPlanFromSubscription,
  constructWebhookEvent
} from './utilities';