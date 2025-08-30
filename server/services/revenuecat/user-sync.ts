/**
 * RevenueCat User Sync Service
 * Syncs RevenueCat subscription data with the database
 */

import { getUserCollection } from '@/config/mongodb';
import type { BillingPeriod, PlanType } from '@shared/payment';
import type { RevenueCatCustomerInfo, RevenueCatStore } from '@shared/revenuecat';
import { ObjectId } from 'mongodb';

import { getCustomer } from './operations/customer';

interface UpdateSubscriptionData {
    userId: string;
    status?: 'active' | 'canceled' | 'expired' | 'past_due' | 'trialing' | 'paused';
    plan?: PlanType;
    previousPlan?: PlanType;
    productId?: string;
    entitlements?: string[];
    currentPeriodEnd?: Date;
    trialEnd?: Date;
    cancelAtPeriodEnd?: boolean;
    canceledAt?: Date | undefined;
    billingIssueDetectedAt?: Date;
    source?: RevenueCatStore | string;
    revenueCatData?: {
        productId?: string;
        entitlements?: string[];
        originalTransactionId?: string;
        price?: number;
        currency?: string;
        periodType?: 'NORMAL' | 'TRIAL' | 'INTRO';
    };
}

/**
 * Update user subscription in database
 */
export async function updateUserSubscription(data: UpdateSubscriptionData): Promise<void> {
    try {
        const usersCollection = getUserCollection();
        const user = await usersCollection.findOne({ _id: new ObjectId(data.userId) });
        if (!user) {
            console.error(`[RevenueCat UserSync] User not found: ${data.userId}`);
            // Try to find by RevenueCat ID if different
            const userByRevenueCatId = await usersCollection.findOne({ revenueCatId: data.userId });
            if (!userByRevenueCatId) {
                throw new Error(`User not found for ID: ${data.userId}`);
            }
            // Use the found user
            data.userId = userByRevenueCatId._id.toString();
        }

        // Build update object
        const updateData: any = {
            'subscription.lastUpdated': new Date(),
        };

        if (data.status !== undefined) {
            updateData['subscription.status'] = data.status;
        }

        if (data.plan !== undefined) {
            updateData['subscription.plan'] = data.plan;
        }

        if (data.previousPlan !== undefined) {
            updateData['subscription.previousPlan'] = data.previousPlan;
        }

        if (data.productId !== undefined) {
            updateData['subscription.productId'] = data.productId;
        }

        if (data.entitlements !== undefined) {
            updateData['subscription.entitlements'] = data.entitlements;
        }

        if (data.currentPeriodEnd !== undefined) {
            updateData['subscription.currentPeriodEnd'] = data.currentPeriodEnd;
        }

        if (data.trialEnd !== undefined) {
            updateData['subscription.trialEnd'] = data.trialEnd;
        }

        if (data.cancelAtPeriodEnd !== undefined) {
            updateData['subscription.willRenew'] = !data.cancelAtPeriodEnd;
        }

        if (data.canceledAt !== undefined) {
            if (data.canceledAt) {
                updateData['subscription.canceledAt'] = data.canceledAt;
            } else {
                updateData.$unset = { 'subscription.canceledAt': '' };
            }
        }

        if (data.billingIssueDetectedAt !== undefined) {
            updateData['subscription.billingIssueDetectedAt'] = data.billingIssueDetectedAt;
        }

        if (data.source !== undefined) {
            updateData['subscription.source'] = mapStoreToSource(data.source);
        }

        if (data.revenueCatData) {
            if (data.revenueCatData.originalTransactionId) {
                updateData['subscription.originalPurchaseDate'] = new Date();
            }
            if (data.revenueCatData.price !== undefined) {
                updateData['subscription.price'] = data.revenueCatData.price;
            }
            if (data.revenueCatData.currency) {
                updateData['subscription.currency'] = data.revenueCatData.currency;
            }
        }

        // Update user
        await usersCollection.updateOne(
            { _id: new ObjectId(data.userId) },
            updateData
        );

        console.log(`[RevenueCat UserSync] Updated subscription for user ${data.userId}`);

    } catch (error) {
        console.error('[RevenueCat UserSync] Error updating subscription:', error);
        throw error;
    }
}

/**
 * Sync user with RevenueCat API
 */
export async function syncUserWithRevenueCat(userId: string): Promise<any> {
    try {
        // Get customer info from RevenueCat
        const customerInfo = await getCustomer(userId);

        if (!customerInfo) {
            // User not found in RevenueCat - set as free
            await updateUserSubscription({
                userId,
                status: 'canceled',
                plan: 'free',
            });
            return null;
        }

        // Map RevenueCat data to our subscription model
        const subscription = mapRevenueCatToSubscription(customerInfo);

        // Update user in database
        const usersCollection = getUserCollection();
        await usersCollection.updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    subscription,
                    revenueCatId: customerInfo.subscriber.original_app_user_id,
                    lastSyncedAt: new Date(),
                }
            }
        );

        return subscription;

    } catch (error: any) {
        if (error.response?.status === 404) {
            // User not found in RevenueCat
            await updateUserSubscription({
                userId,
                status: 'canceled',
                plan: 'free',
            });
            return null;
        }

        console.error('[RevenueCat UserSync] Sync error:', error);
        throw error;
    }
}

/**
 * Map RevenueCat customer info to our subscription model
 */
function mapRevenueCatToSubscription(customerInfo: RevenueCatCustomerInfo): any {
    const subscriber = customerInfo.subscriber;
    const activeEntitlements = Object.keys(subscriber.entitlements || {});
    const hasActiveSubscription = activeEntitlements.length > 0;

    if (!hasActiveSubscription) {
        return {
            status: 'none',
            plan: 'free',
            period: 'monthly' as BillingPeriod,
            cancelAtPeriodEnd: false,
            entitlements: [],
            lastUpdated: new Date(),
        };
    }

    // Get the highest tier entitlement
    const entitlement = getHighestEntitlement(activeEntitlements);
    const entitlementData = subscriber.entitlements[entitlement];

    // Get subscription details
    const subscriptions = Object.values(subscriber.subscriptions || {});
    const activeSubscription = subscriptions.find(sub =>
        new Date(sub.expires_date) > new Date()
    );

    if (!activeSubscription) {
        return {
            status: 'none',
            plan: 'free',
            period: 'monthly' as BillingPeriod,
            cancelAtPeriodEnd: false,
            entitlements: [],
            lastUpdated: new Date(),
        };
    }

    // Determine period from product ID (basic_monthly, pro_yearly, etc)
    const productId = entitlementData.product_identifier;
    const period: BillingPeriod = productId.includes('yearly') ? 'yearly' : 'monthly';

    return {
        status: determineSubscriptionStatus(activeSubscription),
        plan: mapEntitlementToPlan(entitlement),
        period,
        productId: entitlementData.product_identifier,
        entitlements: activeEntitlements,
        currentPeriodEnd: new Date(activeSubscription.expires_date),
        cancelAtPeriodEnd: !activeSubscription.unsubscribe_detected_at,
        willRenew: !activeSubscription.unsubscribe_detected_at,
        source: mapStoreToSource(activeSubscription.store),
        originalPurchaseDate: new Date(activeSubscription.original_purchase_date),
        lastUpdated: new Date(),
    };
}

/**
 * Determine subscription status from RevenueCat subscription
 */
function determineSubscriptionStatus(subscription: any): string {
    const now = new Date();
    const expiresDate = new Date(subscription.expires_date);

    if (subscription.billing_issues_detected_at) {
        return 'past_due';
    }

    if (subscription.unsubscribe_detected_at && expiresDate > now) {
        return 'canceled';
    }

    if (expiresDate <= now) {
        return 'none';
    }

    if (subscription.period_type === 'TRIAL') {
        return 'trialing';
    }

    return 'active';
}

/**
 * Get the highest tier entitlement
 */
function getHighestEntitlement(entitlements: string[]): string {
    const priority = ['enterprise', 'pro', 'basic', 'free'];

    for (const tier of priority) {
        if (entitlements.includes(tier)) {
            return tier;
        }
    }

    return entitlements[0] || 'free';
}

/**
 * Map entitlement to plan type
 */
function mapEntitlementToPlan(entitlement: string): PlanType {
    switch (entitlement) {
        case 'basic':
            return 'basic';
        case 'pro':
            return 'pro';
        case 'enterprise':
            return 'enterprise';
        default:
            return 'free';
    }
}

/**
 * Map store to source
 */
function mapStoreToSource(store: RevenueCatStore | string): string {
    switch (store) {
        case 'APP_STORE':
        case 'MAC_APP_STORE':
            return 'APP_STORE';
        case 'PLAY_STORE':
            return 'PLAY_STORE';
        case 'AMAZON':
            return 'AMAZON';
        case 'STRIPE':
            return 'STRIPE';
        case 'PROMOTIONAL':
            return 'PROMOTIONAL';
        default:
            return store;
    }
}
