/**
 * RevenueCat Configuration Index
 * Main export point for all RevenueCat configuration
 */

import { Platform } from 'react-native';

// ======= Core Configuration & Helpers =======
export {

    // Helper functions
    entitlementToPlan, getHighestEntitlement,
    getPackageIdentifier, PLAN_FEATURES, planToEntitlement,
    // Configuration
    PRODUCT_IDS, REVENUECAT_CONFIG, TRIAL_CONFIG,
    // Validation
    validateRevenueCatConfig
} from './revenuecat';

// ======= Platform-Specific =======
export { getNativeApiKey, NATIVE_CONFIG } from './revenuecat.native';
export { WEB_CONFIG } from './revenuecat.web';

// ======= Types (from shared) =======
export type {
    RevenueCatEntitlementId,
    RevenueCatPurchaseResult,
    RevenueCatSubscriptionInfo
} from '@shared/payment';

// ======= Constants (from shared) =======
export {
    PRICING,
    REVENUECAT_ENTITLEMENTS,
    REVENUECAT_PACKAGES
} from '@shared/payment';

// Import function to avoid dynamic requires
import { getNativeApiKey } from './revenuecat.native';

// Platform-agnostic API key getter - now takes config as parameter
export const getRevenueCatApiKey = (config: { iosKey: string; androidKey: string; webKey: string }): string => {
    if (Platform.OS === 'web') {
        return config.webKey;
    }
    return getNativeApiKey(config.iosKey, config.androidKey);
};

// Re-export specific types for convenience
export type SubscriptionInfo = import('@shared/payment').RevenueCatSubscriptionInfo;
export type PurchaseResult = import('@shared/payment').RevenueCatPurchaseResult;