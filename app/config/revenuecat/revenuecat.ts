/**
 * RevenueCat Core Configuration
 * Central config for all RevenueCat functionality
 */

import type {
    BillingPeriod,
    PlanType,
    RevenueCatEntitlementId
} from '@shared/payment';
import { Platform } from 'react-native';

// ======= Validation =======

/**
 * Validates RevenueCat configuration
 * @param config - Object containing iOS, Android, and Web API keys
 * @returns boolean indicating if configuration is valid
 */
export function validateRevenueCatConfig(config: {
    iosKey?: string;
    androidKey?: string;
    webKey?: string;
}): boolean {
    const platform = Platform.OS;
    
    // Check platform-specific keys
    if (platform === 'ios' && !config.iosKey) {
        console.error('[RevenueCat] Missing iOS API key');
        return false;
    }
    
    if (platform === 'android' && !config.androidKey) {
        console.error('[RevenueCat] Missing Android API key');
        return false;
    }
    
    if (platform === 'web' && !config.webKey) {
        console.error('[RevenueCat] Missing Web API key');
        return false;
    }
    
    // Validate key format (basic check)
    const key = platform === 'ios' ? config.iosKey : 
                platform === 'android' ? config.androidKey : 
                config.webKey;
                
    if (key && key.length < 10) {
        console.error('[RevenueCat] API key appears to be invalid (too short)');
        return false;
    }
    
    return true;
}

// Import the constants from shared types
const Entitlements = {
    FREE: 'free',
    BASIC: 'basic',
    PRO: 'pro',
    ENTERPRISE: 'enterprise',
} as const;

const Packages = {
    BASIC_MONTHLY: 'basic_monthly',
    BASIC_YEARLY: 'basic_yearly',
    PRO_MONTHLY: 'pro_monthly',
    PRO_YEARLY: 'pro_yearly',
    ENTERPRISE_MONTHLY: 'enterprise_monthly',
    ENTERPRISE_YEARLY: 'enterprise_yearly',
} as const;

// ======= Product Configuration =======

// Product IDs for each platform
// These must match exactly what's configured in App Store Connect, Google Play Console, and RevenueCat
export const PRODUCT_IDS = {
    basic_monthly: Platform.select({
        ios: 'com.ingrd.basic.monthly',
        android: 'com.ingrd.basic.monthly',
        web: 'rc_basic_monthly',
        default: 'com.ingrd.basic.monthly',
    })!,

    basic_yearly: Platform.select({
        ios: 'com.ingrd.basic.yearly',
        android: 'com.ingrd.basic.yearly',
        web: 'rc_basic_yearly',
        default: 'com.ingrd.basic.yearly',
    })!,

    pro_monthly: Platform.select({
        ios: 'com.ingrd.pro.monthly',
        android: 'com.ingrd.pro.monthly',
        web: 'rc_pro_monthly',
        default: 'com.ingrd.pro.monthly',
    })!,

    pro_yearly: Platform.select({
        ios: 'com.ingrd.pro.yearly',
        android: 'com.ingrd.pro.yearly',
        web: 'rc_pro_yearly',
        default: 'com.ingrd.pro.yearly',
    })!,

    enterprise_monthly: Platform.select({
        ios: 'com.ingrd.enterprise.monthly',
        android: 'com.ingrd.enterprise.monthly',
        web: 'rc_enterprise_monthly',
        default: 'com.ingrd.enterprise.monthly',
    })!,

    enterprise_yearly: Platform.select({
        ios: 'com.ingrd.enterprise.yearly',
        android: 'com.ingrd.enterprise.yearly',
        web: 'rc_enterprise_yearly',
        default: 'com.ingrd.enterprise.yearly',
    })!,
};

// ======= Entitlement Helpers =======

// Map entitlements to plan types
export const entitlementToPlan = (entitlementId: string): PlanType => {
    switch (entitlementId) {
        case Entitlements.BASIC:
            return 'basic';
        case Entitlements.PRO:
            return 'pro';
        case Entitlements.ENTERPRISE:
            return 'enterprise';
        case Entitlements.FREE:
        default:
            return 'free';
    }
};

// Map plan types to entitlements
export const planToEntitlement = (plan: PlanType): RevenueCatEntitlementId => {
    switch (plan) {
        case 'basic':
            return Entitlements.BASIC;
        case 'pro':
            return Entitlements.PRO;
        case 'enterprise':
            return Entitlements.ENTERPRISE;
        case 'free':
        default:
            return Entitlements.FREE;
    }
};

// Get the highest tier entitlement from a list
export const getHighestEntitlement = (entitlements: string[]): RevenueCatEntitlementId => {
    if (entitlements.includes(Entitlements.ENTERPRISE)) {
        return Entitlements.ENTERPRISE;
    }
    if (entitlements.includes(Entitlements.PRO)) {
        return Entitlements.PRO;
    }
    if (entitlements.includes(Entitlements.BASIC)) {
        return Entitlements.BASIC;
    }
    return Entitlements.FREE;
};

// ======= Package Helpers =======

// Get package identifier from plan and period
export const getPackageIdentifier = (plan: PlanType, period: BillingPeriod): string | null => {
    if (plan === 'free') return null;
    return `${plan}_${period}`;
};

// ======= Feature Configuration =======

export const PLAN_FEATURES = {
    free: [
        '1 project',
        '1 team member',
        '1GB storage',
        'Community support',
        'Basic features',
    ],
    basic: [
        '10 projects',
        '3 team members',
        '10GB storage',
        'Email support',
        'Basic analytics',
    ],
    pro: [
        'Unlimited projects',
        '10 team members',
        '100GB storage',
        'Priority support',
        'Advanced analytics',
        'API access',
    ],
    enterprise: [
        'Everything in Pro',
        'Unlimited team members',
        'Unlimited storage',
        'Dedicated support',
        'Custom integrations',
        'SLA guarantee',
    ],
};

// ======= Trial Configuration =======

export const TRIAL_CONFIG = {
    enabled: true,
    durationDays: 14,
    eligiblePlans: ['basic', 'pro', 'enterprise'] as PlanType[],
};

// ======= Core Configuration =======

export const REVENUECAT_CONFIG = {
    // Use your backend user ID as RevenueCat user ID
    useUserIdAsAppUserId: true,

    // Enable debug logs in development
    enableDebugLogs: __DEV__,

    // Observer mode - set to true if keeping existing billing system temporarily
    observerMode: false,

    // StoreKit 2 (iOS 15+) - use if available
    usesStoreKit2IfAvailable: true,

    // Show in-app messages automatically
    shouldShowInAppMessagesAutomatically: true,
};
