import { getUserCollection } from '@/config/mongodb';
import { ObjectId, WithId, Document } from 'mongodb';
import Stripe from 'stripe';
import { getPlanFromPriceId } from '../utilities/get-plan-from-price-id';
import { createLogger } from '@/utils/logging/logger';
import { mongoDocToUser } from '@/utils/database/mongodb';
import type { User } from '@shared';

const logger = createLogger('Stripe:UpdateUserSubscription');

interface SubscriptionUpdateData {
  id: string;
  status: Stripe.Subscription.Status;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  period: 'monthly' | 'yearly';
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  priceId: string;
  productId: string;
  lastSyncedAt: Date;
  requiresAction?: boolean;
}

/**
 * Update user's subscription data in MongoDB
 * This is the single source of truth for subscription updates
 */
export async function updateUserSubscription(
  userId: string,
  subscription: Stripe.Subscription | null
): Promise<void> {
  const usersCollection = getUserCollection();
  
  if (!subscription) {
    // Clear subscription data
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $unset: { subscription: 1 } }
    );
    logger.info(`Cleared subscription for user ${userId}`);
    return;
  }
  
  // Get plan from price ID
  const priceId = subscription.items.data[0].price.id;
  const plan = getPlanFromPriceId(priceId);
  
  // Determine period based on price ID
  const period = priceId.includes('yearly') || priceId.includes('year') ? 'yearly' : 'monthly';
  
  // Build subscription data
  const sub = subscription as Stripe.Subscription & {
    current_period_end: number;
  };
  const subscriptionData: SubscriptionUpdateData = {
    id: sub.id,
    status: sub.status,
    plan,
    period,
    currentPeriodEnd: new Date(sub.current_period_end * 1000),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    priceId,
    productId: sub.items.data[0].price.product as string,
    lastSyncedAt: new Date(),
  };
  
  await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { subscription: subscriptionData } }
  );
  
  logger.info(`Updated subscription for user ${userId}: ${subscription.status}`);
}

/**
 * Update user's subscription status only
 */
export async function updateUserSubscriptionStatus(
  userId: string,
  status: Stripe.Subscription.Status,
  additionalData?: Partial<SubscriptionUpdateData>
): Promise<void> {
  const usersCollection = getUserCollection();
  
  const updateData: any = {
    'subscription.status': status,
    'subscription.lastSyncedAt': new Date(),
  };
  
  // Add any additional fields
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      updateData[`subscription.${key}`] = value;
    });
  }
  
  await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    { $set: updateData }
  );
  
  logger.info(`Updated subscription status for user ${userId}: ${status}`);
}

/**
 * Find user by Stripe customer ID and update subscription
 */
export async function updateUserSubscriptionByCustomerId(
  customerId: string,
  subscription: Stripe.Subscription | null
): Promise<User | null> {
  const usersCollection = getUserCollection();
  
  // Find user by customer ID
  const user = await usersCollection.findOne({ stripeCustomerId: customerId });
  if (!user) {
    logger.warn(`User not found for customer ${customerId}`);
    return null;
  }
  
  // Update subscription
  await updateUserSubscription(user._id.toString(), subscription);
  
  return mongoDocToUser(user);
}

/**
 * Find user by Stripe customer ID
 */
export async function findUserByStripeCustomerId(customerId: string): Promise<User | null> {
  const usersCollection = getUserCollection();
  const user = await usersCollection.findOne({ stripeCustomerId: customerId });
  
  if (!user) {
    logger.warn(`User not found for customer ${customerId}`);
    return null;
  }
  
  return mongoDocToUser(user);
}