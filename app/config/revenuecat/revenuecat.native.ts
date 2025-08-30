/**
 * RevenueCat Native Configuration
 * iOS and Android specific setup
 */

import { Platform } from 'react-native';

import { config } from '../';

// Native-specific API Keys
export const REVENUECAT_NATIVE_KEYS = {
    ios: config.revenuecat.iosKey,
    android: config.revenuecat.androidKey,
};

// Get the appropriate API key for the current platform
export const getNativeApiKey = (): string => {
    return Platform.select({
        ios: REVENUECAT_NATIVE_KEYS.ios,
        android: REVENUECAT_NATIVE_KEYS.android,
        default: '',
    }) || '';
};

// Native-specific configuration
export const NATIVE_CONFIG = {
    // iOS specific
    ios: {
        // Use StoreKit 2 for iOS 15+
        usesStoreKit2IfAvailable: true,
        // Show promotional offers
        shouldShowPromotionalOffers: true,
    },

    // Android specific  
    android: {
        // Use Amazon Store if needed
        useAmazonSandbox: false,
        // Enable pending purchases
        enablePendingPurchases: true,
    },
};
