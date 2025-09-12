/**
 * RevenueCat Native Configuration
 * iOS and Android specific setup
 */

import { Platform } from 'react-native';

// Get the appropriate API key for the current platform
export const getNativeApiKey = (iosKey: string, androidKey: string): string => {
    return Platform.select({
        ios: iosKey,
        android: androidKey,
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
