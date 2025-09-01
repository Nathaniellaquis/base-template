/**
 * RevenueCat Webhook Event Handlers
 * Process different types of RevenueCat webhook events
 */

import { updateUserSubscription } from '@/services/revenuecat/user-sync';
import { logger } from '@/utils/logging';
import type { PlanType } from '@shared/payment';
import type { RevenueCatWebhookEvent } from '@shared/revenuecat';


export async function handleWebhookEvent(event: RevenueCatWebhookEvent) {
    console.log(`[RevenueCat Handler] Processing ${event.type} for user ${event.app_user_id}`);

    switch (event.type) {
        // Purchase events
        case 'INITIAL_PURCHASE':
        case 'RENEWAL':
        case 'TRIAL_CONVERTED':
            await handlePurchase(event);
            break;

        // Trial events
        case 'TRIAL_STARTED':
            await handleTrialStarted(event);
            break;

        case 'TRIAL_CANCELLED':
            await handleTrialCancelled(event);
            break;

        // Cancellation events  
        case 'CANCELLATION':
            await handleCancellation(event);
            break;

        case 'UNCANCELLATION':
            await handleUncancellation(event);
            break;

        case 'EXPIRATION':
            await handleExpiration(event);
            break;

        // Product changes
        case 'PRODUCT_CHANGE':
            await handleProductChange(event);
            break;

        // Billing issues
        case 'BILLING_ISSUE':
            await handleBillingIssue(event);
            break;

        // User management
        case 'SUBSCRIBER_ALIAS':
            await handleSubscriberAlias(event);
            break;

        case 'TRANSFER':
            await handleTransfer(event);
            break;

        // Subscription pause (Android only)
        case 'SUBSCRIPTION_PAUSED':
            await handleSubscriptionPaused(event);
            break;

        // Test event
        case 'TEST':
            console.log('[RevenueCat Handler] Test event received');
            break;

        default:
            console.log(`[RevenueCat Handler] Unhandled event type: ${event.type}`);
    }
}

// Handle successful purchase or renewal
async function handlePurchase(event: RevenueCatWebhookEvent) {
    const plan = mapProductToPlan(event.product_id || '');

    await updateUserSubscription({
        userId: event.app_user_id,
        status: 'active',
        plan,
        currentPeriodEnd: event.expiration_at_ms ? new Date(event.expiration_at_ms) : undefined,
        cancelAtPeriodEnd: false,
        source: event.store,
        revenueCatData: {
            productId: event.product_id,
            entitlements: event.entitlement_ids,
            originalTransactionId: event.original_transaction_id,
            price: event.price_in_purchased_currency,
            currency: event.currency,
            periodType: event.period_type,
        },
    });

    // Track analytics
    await logger.info('subscription_started', {
        userId: event.app_user_id,
        plan: event.product_id,
        revenue: event.price_in_purchased_currency,
        store: event.store,
        isTrialConversion: event.type === 'TRIAL_CONVERTED',
    });
}

// Handle trial start
async function handleTrialStarted(event: RevenueCatWebhookEvent) {
    const plan = mapProductToPlan(event.product_id || '');

    await updateUserSubscription({
        userId: event.app_user_id,
        status: 'trialing',
        plan,
        currentPeriodEnd: event.expiration_at_ms ? new Date(event.expiration_at_ms) : undefined,
        trialEnd: event.expiration_at_ms ? new Date(event.expiration_at_ms) : undefined,
        source: event.store,
    });

    await logger.info('trial_started', {
        userId: event.app_user_id,
        plan: event.product_id,
        trialEndDate: event.expiration_at_ms,
    });
}

// Handle trial cancellation
async function handleTrialCancelled(event: RevenueCatWebhookEvent) {
    await updateUserSubscription({
        userId: event.app_user_id,
        status: 'canceled',
        cancelAtPeriodEnd: true,
    });

    await logger.info('trial_cancelled', {
        userId: event.app_user_id,
        reason: event.cancellation_reason,
    });
}

// Handle subscription cancellation
async function handleCancellation(event: RevenueCatWebhookEvent) {
    await updateUserSubscription({
        userId: event.app_user_id,
        status: 'canceled',
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
    });

    await logger.info('subscription_cancelled', {
        userId: event.app_user_id,
        reason: event.cancellation_reason,
        willExpireAt: event.expiration_at_ms,
    });
}

// Handle subscription uncancellation (reactivation)
async function handleUncancellation(event: RevenueCatWebhookEvent) {
    await updateUserSubscription({
        userId: event.app_user_id,
        status: 'active',
        cancelAtPeriodEnd: false,
        canceledAt: undefined,
    });

    await logger.info('subscription_reactivated', {
        userId: event.app_user_id,
    });
}

// Handle subscription expiration
async function handleExpiration(event: RevenueCatWebhookEvent) {
    await updateUserSubscription({
        userId: event.app_user_id,
        status: 'expired',
        plan: 'free',
    });

    await logger.info('subscription_expired', {
        userId: event.app_user_id,
        lastProduct: event.product_id,
    });
}

// Handle product change (upgrade/downgrade)
async function handleProductChange(event: RevenueCatWebhookEvent) {
    const newPlan = mapProductToPlan(event.product_id || '');

    await updateUserSubscription({
        userId: event.app_user_id,
        plan: newPlan,
        previousPlan: event.new_product_id ? mapProductToPlan(event.new_product_id) : undefined,
    });

    await logger.info('subscription_changed', {
        userId: event.app_user_id,
        from: event.new_product_id, // Previous product
        to: event.product_id, // New product
    });
}

// Handle billing issues
async function handleBillingIssue(event: RevenueCatWebhookEvent) {
    await updateUserSubscription({
        userId: event.app_user_id,
        status: 'past_due',
        billingIssueDetectedAt: new Date(),
    });

    await logger.info('billing_issue', {
        userId: event.app_user_id,
        gracePeriodEnd: event.grace_period_expiration_at_ms,
    });
}

// Handle subscriber alias (user ID change)
async function handleSubscriberAlias(event: RevenueCatWebhookEvent) {
    // This happens when a user ID is changed or merged
    // You may need to update your user records
    console.log(`[RevenueCat Handler] User alias created: ${event.app_user_id} -> ${event.aliases?.join(', ')}`);
}

// Handle transfer between stores
async function handleTransfer(event: RevenueCatWebhookEvent) {
    // This happens when a subscription is transferred between app stores
    console.log(`[RevenueCat Handler] Subscription transferred for user ${event.app_user_id}`);

    await logger.info('subscription_transferred', {
        userId: event.app_user_id,
        from: event.transferred_from,
        to: event.transferred_to,
    });
}

// Handle subscription pause (Android only)
async function handleSubscriptionPaused(event: RevenueCatWebhookEvent) {
    await updateUserSubscription({
        userId: event.app_user_id,
        status: 'paused',
    });

    await logger.info('subscription_paused', {
        userId: event.app_user_id,
        resumeDate: event.expiration_at_ms,
    });
}

// Helper function to map product IDs to plan types
function mapProductToPlan(productId: string): PlanType {
    const mapping: Record<string, PlanType> = {
        // iOS/Android products
        'com.ingrd.basic.monthly': 'basic',
        'com.ingrd.basic.yearly': 'basic',
        'com.ingrd.pro.monthly': 'pro',
        'com.ingrd.pro.yearly': 'pro',
        'com.ingrd.enterprise.monthly': 'enterprise',
        'com.ingrd.enterprise.yearly': 'enterprise',

        // Web products
        'rc_basic_monthly': 'basic',
        'rc_basic_yearly': 'basic',
        'rc_pro_monthly': 'pro',
        'rc_pro_yearly': 'pro',
        'rc_enterprise_monthly': 'enterprise',
        'rc_enterprise_yearly': 'enterprise',
    };

    return mapping[productId] || 'free';
}
