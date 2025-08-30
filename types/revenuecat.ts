/**
 * RevenueCat Types
 * Type definitions for RevenueCat webhook events and API responses
 */

// ======= Webhook Event Types =======

export type RevenueCatWebhookEventType =
    | 'INITIAL_PURCHASE'
    | 'RENEWAL'
    | 'CANCELLATION'
    | 'UNCANCELLATION'
    | 'NON_RENEWING_PURCHASE'
    | 'EXPIRATION'
    | 'PRODUCT_CHANGE'
    | 'BILLING_ISSUE'
    | 'SUBSCRIBER_ALIAS'
    | 'SUBSCRIPTION_PAUSED'
    | 'TRANSFER'
    | 'TRIAL_STARTED'
    | 'TRIAL_CONVERTED'
    | 'TRIAL_CANCELLED'
    | 'TEST';

export type RevenueCatStore =
    | 'APP_STORE'
    | 'MAC_APP_STORE'
    | 'PLAY_STORE'
    | 'AMAZON'
    | 'STRIPE'
    | 'PROMOTIONAL';

export interface RevenueCatWebhookEvent {
    id: string;
    type: RevenueCatWebhookEventType;
    app_user_id: string;
    aliases?: string[];
    product_id?: string;
    entitlement_ids?: string[];
    period_type?: 'NORMAL' | 'TRIAL' | 'INTRO';
    purchased_at_ms?: number;
    expiration_at_ms?: number;
    grace_period_expiration_at_ms?: number;
    presented_offering_id?: string;
    transaction_id?: string;
    original_transaction_id?: string;
    is_family_share?: boolean;
    country_code?: string;
    app_id?: string;

    // Pricing
    price?: number;
    price_in_purchased_currency?: number;
    currency?: string;

    // Store
    store?: RevenueCatStore;
    environment?: 'SANDBOX' | 'PRODUCTION';

    // Cancellation
    cancellation_reason?: string;

    // Product change
    new_product_id?: string;

    // Transfer
    transferred_from?: Array<{
        product_id: string;
        store: RevenueCatStore;
    }>;
    transferred_to?: Array<{
        product_id: string;
        store: RevenueCatStore;
    }>;

    // Billing issue
    at_period_end?: boolean;
}

export interface RevenueCatWebhookPayload {
    api_version: string;
    event: RevenueCatWebhookEvent;
}

// ======= API Response Types =======

export interface RevenueCatCustomerInfo {
    request_date: string;
    request_date_ms: number;
    subscriber: RevenueCatSubscriber;
}

export interface RevenueCatSubscriber {
    entitlements: Record<string, RevenueCatEntitlement>;
    first_seen: string;
    last_seen: string;
    management_url: string | null;
    non_subscriptions: Record<string, any[]>;
    original_app_user_id: string;
    original_application_version: string | null;
    original_purchase_date: string | null;
    other_purchases: Record<string, any>;
    subscriptions: Record<string, RevenueCatSubscription>;
}

export interface RevenueCatEntitlement {
    expires_date: string | null;
    grace_period_expires_date: string | null;
    product_identifier: string;
    purchase_date: string;
}

export interface RevenueCatSubscription {
    auto_resume_date: string | null;
    billing_issues_detected_at: string | null;
    expires_date: string;
    grace_period_expires_date: string | null;
    is_sandbox: boolean;
    original_purchase_date: string;
    ownership_type: 'PURCHASED' | 'FAMILY_SHARED';
    period_type: 'NORMAL' | 'TRIAL' | 'INTRO';
    purchase_date: string;
    refunded_at: string | null;
    store: RevenueCatStore;
    unsubscribe_detected_at: string | null;
}
