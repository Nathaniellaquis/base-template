/**
 * RevenueCat Web Configuration
 * Web-specific setup for RevenueCat Web SDK
 */

// Web-specific configuration
export const WEB_CONFIG = {
    // Web SDK specific settings
    enableCaching: true,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes

    // Billing portal settings
    billingPortal: {
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
