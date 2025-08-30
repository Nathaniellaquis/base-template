/**
 * RevenueCat Configuration Index
 * Main export point for all RevenueCat configuration
 */

import { Platform } from 'react-native';

// ======= Core Configuration & Helpers =======
export {
    // Validation
    validateRevenueCatConfig,
    
    // Configuration
    PRODUCT_IDS,
    PLAN_FEATURES,
    TRIAL_CONFIG,
    REVENUECAT_CONFIG,
    
    // Helper functions
    entitlementToPlan,
    planToEntitlement,
    getHighestEntitlement,
    getPackageIdentifier,
} from './revenuecat';

// ======= Platform-Specific =======
export { getNativeApiKey, NATIVE_CONFIG } from './revenuecat.native';
export { REVENUECAT_WEB_KEY, WEB_CONFIG } from './revenuecat.web';

// ======= Types (from shared) =======
export type {
    RevenueCatEntitlementId,
    RevenueCatPurchaseResult,
    RevenueCatSubscriptionInfo,
} from '@shared/payment';

// ======= Constants (from shared) =======
export {
    PRICING,
    REVENUECAT_ENTITLEMENTS,
    REVENUECAT_PACKAGES,
} from '@shared/payment';

// Import both to avoid dynamic requires
import { getNativeApiKey } from './revenuecat.native';
import { REVENUECAT_WEB_KEY } from './revenuecat.web';

// Platform-agnostic API key getter
export const getRevenueCatApiKey = (): string => {
    if (Platform.OS === 'web') {
        return REVENUECAT_WEB_KEY;
    }
    return getNativeApiKey();
};

// Re-export specific types for convenience
export type SubscriptionInfo = import('@shared/payment').RevenueCatSubscriptionInfo;
export type PurchaseResult = import('@shared/payment').RevenueCatPurchaseResult;