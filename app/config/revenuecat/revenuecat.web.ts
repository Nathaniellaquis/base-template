/**
 * RevenueCat Web Configuration
 * Web-specific setup for RevenueCat Web SDK
 */

import { config } from '../';

// Web-specific API Key
export const REVENUECAT_WEB_KEY = config.revenuecat.webKey;

// Web-specific configuration
export const WEB_CONFIG = {
    // Web SDK specific settings
    enableCaching: true,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes

    // Billing portal settings
    billingPortal: {
        returnUrl: config.api.url || 'https://app.ingrd.com',
        showManageSubscriptions: true,
        showUpdatePaymentMethod: true,
    },

    // Web payment settings
    payment: {
        // Payment request options
        requestPayerEmail: true,
        requestPayerName: true,
    },
};
