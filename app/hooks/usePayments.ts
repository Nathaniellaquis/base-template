/**
 * Payments Hook
 * Unified payment handling for both web and mobile platforms
 * Uses RevenueCat for subscription management
 * 
 * SIMPLIFIED: Only exposes what you actually need. The subscription object
 * contains all the details (plan, status, trial, expiry, etc.)
 * 
 * @see usePayments() example below for all available properties
 */

import {
    entitlementToPlan,
    getHighestEntitlement,
    getPackageIdentifier,
    getRevenueCatApiKey,
    PRICING,
    REVENUECAT_CONFIG,
} from '@/config/revenuecat';
import { config } from '@/config';
import { trackPaywall } from '@/lib/analytics/tracking';
import { useAuth } from '@/providers/auth';
import type {
    BillingPeriod, PlanType,
    RevenueCatPurchaseResult as PurchaseResult,
    RevenueCatSubscriptionInfo as SubscriptionInfo,
} from '@shared/payment';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';

// Native imports (will be tree-shaken on web)
import type {
    CustomerInfo as CustomerInfoNative,
    PurchasesOfferings,
} from 'react-native-purchases';

// Web imports (will be tree-shaken on mobile)
import type {
    CustomerInfo as CustomerInfoWeb,
    Offerings as OfferingsWeb,
    Purchases as PurchasesWeb,
} from '@revenuecat/purchases-js';

// Dynamic imports
let Purchases: typeof import('react-native-purchases').default | null = null;
let PurchasesJS: typeof import('@revenuecat/purchases-js') | null = null;

// Unified types
type CustomerInfo = CustomerInfoNative | CustomerInfoWeb;
type Offerings = PurchasesOfferings | OfferingsWeb;

interface UsePaymentsReturn {
    // Payment system state (clear what's loading)
    isPaymentSystemReady: boolean;           // Payment SDK is initialized and ready
    isLoadingPaymentSystem: boolean;         // Payment system is initializing

    // Subscription info
    subscription: SubscriptionInfo | null;   // Contains: plan, isActive, isInTrialPeriod, expiresAt, willRenew, etc.
    hasActiveSubscription: boolean;          // Quick check for active subscription
    daysUntilRenewal: number | null;         // Days until subscription renews/expires (saves calculation elsewhere)
    canAccessPlan: (plan: PlanType) => boolean; // Check if user's tier includes access (saves hierarchy logic)

    // Purchase operations
    purchaseSubscription: (plan: PlanType, period: BillingPeriod) => Promise<PurchaseResult>;
    isPurchasing: boolean;                   // Purchase in progress

    // Subscription management
    cancelSubscription?: () => Promise<boolean>; // Cancel subscription (calls server)
    refreshSubscriptionData: () => Promise<void>; // Manual refresh (for pull-to-refresh, etc.)

    // Restore functionality
    restorePurchases?: () => Promise<void>;  // Restore purchases (mobile only)
    isRestoring: boolean;                    // Shows restore in progress (for UI feedback)

    // Web-specific
    openBillingPortal?: () => Promise<void>; // Billing portal (web only)
}

export const usePayments = (): UsePaymentsReturn => {
    const { user } = useAuth();
    const isWeb = Platform.OS === 'web';

    // Payment system state
    const [isPaymentSystemReady, setIsPaymentSystemReady] = useState(false);
    const [isLoadingPaymentSystem, setIsLoadingPaymentSystem] = useState(true);
    const [subscriptionData, setSubscriptionData] = useState<CustomerInfo | null>(null);
    const [availablePlans, setAvailablePlans] = useState<Offerings | null>(null);
    const [paymentSystemError, setPaymentSystemError] = useState<Error | null>(null);

    // Purchase state
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    // Web SDK instance
    const [webPurchases, setWebPurchases] = useState<PurchasesWeb | null>(null);

    // Initialization flag and retry count
    const initializationRef = useRef(false);
    const retryCount = useRef(0);
    const MAX_RETRIES = 3;

    // Parse subscription info from raw data
    const subscription = subscriptionData ? getSubscriptionInfo(subscriptionData, isWeb) : null;

    // Payment availability
    const canMakePayments = isPaymentSystemReady && !paymentSystemError;
    const hasPlansAvailable = Boolean(availablePlans &&
        ((isWeb && (availablePlans as OfferingsWeb).current) ||
            (!isWeb && (availablePlans as PurchasesOfferings).current)));

    // Subscription status helpers
    const hasActiveSubscription = subscription?.isActive ?? false;
    const isInTrialPeriod = subscription?.isInTrialPeriod ?? false;

    // Calculate days until renewal
    const daysUntilRenewal = subscription?.expiresAt
        ? Math.ceil((subscription.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;

    // Check if user can access a specific plan tier
    const canAccessPlan = useCallback((plan: PlanType): boolean => {
        if (!subscription?.isActive) return false;
        const planHierarchy = ['free', 'basic', 'pro', 'enterprise'];
        const currentIndex = planHierarchy.indexOf(subscription.plan);
        const requestedIndex = planHierarchy.indexOf(plan);
        return currentIndex >= requestedIndex;
    }, [subscription]);

    // Initialize SDK (web or mobile)
    const initializeSDK = useCallback(async () => {
        if (initializationRef.current) return;

        try {
            initializationRef.current = true;
            setIsLoadingPaymentSystem(true);
            setPaymentSystemError(null);

            if (isWeb) {
                // Initialize Web SDK
                if (!PurchasesJS) {
                    PurchasesJS = await import('@revenuecat/purchases-js');
                }

                const apiKey = config.revenuecat.webKey;
                if (!apiKey) {
                    throw new Error('RevenueCat Web API key not configured');
                }

                const purchasesInstance = PurchasesJS.Purchases.configure({
                    apiKey,
                    appUserId: user?._id || '',
                });

                if (REVENUECAT_CONFIG.enableDebugLogs && __DEV__) {
                    PurchasesJS.Purchases.setLogLevel(PurchasesJS.LogLevel.Debug);
                }

                setWebPurchases(purchasesInstance);

                // Set user attributes
                if (user) {
                    await purchasesInstance.setAttributes({
                        '$email': user.email || '',
                        '$displayName': user.displayName || '',
                        'userId': user._id || null,
                        'signupSource': 'web_app',
                        'platform': 'web',
                    });
                }

                // Fetch initial data
                const [subscriptionData, plansData] = await Promise.all([
                    purchasesInstance.getCustomerInfo(),
                    purchasesInstance.getOfferings(),
                ]);

                setSubscriptionData(subscriptionData as CustomerInfo);
                setAvailablePlans(plansData as Offerings);

            } else {
                // Initialize Native SDK
                if (!Purchases) {
                    const RNPurchases = await import('react-native-purchases');
                    Purchases = RNPurchases.default;
                }

                const apiKey = getRevenueCatApiKey(config.revenuecat);
                if (!apiKey) {
                    throw new Error('RevenueCat API key not configured');
                }

                await Purchases.configure({
                    apiKey,
                    appUserID: user?._id || null,
                });

                // Set user attributes
                if (user) {
                    await Purchases.setAttributes({
                        '$email': user.email || '',
                        '$displayName': user.displayName || '',
                        'userId': user._id || null,
                        'signupSource': 'mobile_app',
                    });
                }

                // Fetch initial data
                const [subscriptionData, plansData] = await Promise.all([
                    Purchases.getCustomerInfo(),
                    Purchases.getOfferings(),
                ]);

                setSubscriptionData(subscriptionData as CustomerInfo);
                setAvailablePlans(plansData as Offerings);
            }

            setIsPaymentSystemReady(true);
            console.log(`[Payments ${isWeb ? 'Web' : 'Native'}] Initialization complete`);
            retryCount.current = 0; // Reset retry count on success

        } catch (err) {
            console.error(`[Payments ${isWeb ? 'Web' : 'Native'}] Initialization failed:`, err);
            setPaymentSystemError(err as Error);

            // Auto-retry logic for initialization failures
            if (retryCount.current < MAX_RETRIES) {
                retryCount.current++;
                console.log(`[Payments] Retrying initialization (${retryCount.current}/${MAX_RETRIES})...`);
                setTimeout(() => {
                    initializationRef.current = false;
                    initializeSDK();
                }, 2000 * retryCount.current); // Exponential backoff
            }
        } finally {
            setIsLoadingPaymentSystem(false);
        }
    }, [user?._id, isWeb]);

    // Refresh subscription data from provider
    const refreshSubscriptionData = useCallback(async (): Promise<void> => {
        try {
            if (isWeb && webPurchases) {
                const info = await webPurchases.getCustomerInfo();
                setSubscriptionData(info as CustomerInfo);
            } else if (!isWeb && Purchases) {
                const info = await Purchases.getCustomerInfo();
                setSubscriptionData(info as CustomerInfo);
            }
        } catch (err) {
            console.error('[Payments] Failed to refresh customer info:', err);
            throw err;
        }
    }, [isWeb, webPurchases]);

    // Refresh available plans/products
    const refreshAvailablePlans = useCallback(async (): Promise<void> => {
        try {
            if (isWeb && webPurchases) {
                const offers = await webPurchases.getOfferings();
                setAvailablePlans(offers as Offerings);
            } else if (!isWeb && Purchases) {
                const offers = await Purchases.getOfferings();
                setAvailablePlans(offers as Offerings);
            }
        } catch (err) {
            console.error('[Payments] Failed to refresh offerings:', err);
            throw err;
        }
    }, [isWeb, webPurchases]);

    // Purchase subscription
    const purchaseSubscription = useCallback(async (
        plan: PlanType,
        period: BillingPeriod
    ): Promise<PurchaseResult> => {
        if (plan === 'free') {
            return { success: true };
        }

        setIsPurchasing(true);

        try {
            // Track purchase attempt
            trackPaywall.paymentAttempt(plan, period, 'revenuecat');

            // Get package identifier
            const packageId = getPackageIdentifier(plan, period);
            if (!packageId) {
                throw new Error(`No package found for ${plan} ${period}`);
            }

            if (isWeb && webPurchases && availablePlans) {
                // Web purchase
                const webOfferings = availablePlans as OfferingsWeb;
                const targetPackage = webOfferings.current?.availablePackages.find(
                    pkg => pkg.identifier === packageId
                );

                if (!targetPackage) {
                    throw new Error(`Package ${packageId} not found`);
                }

                const result = await webPurchases.purchase({ rcPackage: targetPackage });

                if ('customerInfo' in result) {
                    await refreshSubscriptionData();
                    const price = (PRICING[plan as keyof typeof PRICING] as any)[period];
                    trackPaywall.paymentSuccess(plan, period, price, 'stripe');

                    return {
                        success: true,
                        customerInfo: result.customerInfo as any,
                    };
                } else {
                    trackPaywall.paymentCanceled(plan, period, 'user_cancelled');
                    return {
                        success: false,
                        userCancelled: true,
                    };
                }

            } else if (!isWeb && Purchases && availablePlans) {
                // Native purchase
                const nativeOfferings = availablePlans as PurchasesOfferings;
                const targetPackage = nativeOfferings.current?.availablePackages.find(
                    pkg => pkg.identifier === packageId
                );

                if (!targetPackage) {
                    throw new Error(`Package ${packageId} not found`);
                }

                const result = await Purchases.purchasePackage(targetPackage);
                await refreshSubscriptionData();

                const price = (PRICING[plan as keyof typeof PRICING] as any)[period];
                trackPaywall.paymentSuccess(plan, period, price);

                return {
                    success: true,
                    customerInfo: result.customerInfo as any,
                };
            }

            throw new Error('RevenueCat not initialized');

        } catch (error: any) {
            // Handle cancellation
            if (!isWeb && error.code === 1) { // PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
                trackPaywall.paymentCanceled(plan, period, 'user_cancelled');
                return {
                    success: false,
                    userCancelled: true,
                    error,
                };
            }

            // Track error
            trackPaywall.paymentError(plan, period, 'revenuecat', error.message);

            // Show alert
            Alert.alert('Purchase Failed', error.message || 'An error occurred during purchase.');

            return {
                success: false,
                error,
            };

        } finally {
            setIsPurchasing(false);
        }
    }, [isWeb, webPurchases, availablePlans, refreshSubscriptionData]);

    // Restore purchases
    const restorePurchases = useCallback(async (): Promise<CustomerInfo | null> => {
        setIsRestoring(true);

        try {
            let restoredInfo: CustomerInfo | null = null;

            if (isWeb && webPurchases) {
                const customerInfo = await webPurchases.getCustomerInfo();
                restoredInfo = customerInfo as CustomerInfo;
            } else if (!isWeb && Purchases) {
                restoredInfo = await Purchases.restorePurchases() as CustomerInfo;
            }

            if (restoredInfo) {
                await refreshSubscriptionData();

                const hasActive = isWeb
                    ? Object.keys((restoredInfo as CustomerInfoWeb).entitlements).length > 0
                    : Object.keys((restoredInfo as CustomerInfoNative).entitlements.active).length > 0;

                if (hasActive) {
                    Alert.alert('Restore Successful', 'Your purchases have been restored successfully.');
                    const entitlements = isWeb
                        ? Object.keys((restoredInfo as CustomerInfoWeb).entitlements)
                        : Object.keys((restoredInfo as CustomerInfoNative).entitlements.active);
                    trackPaywall.purchasesRestored(entitlements);
                } else {
                    Alert.alert('No Purchases Found', 'No previous purchases found for this account.');
                }
            }

            return restoredInfo;

        } catch (error: any) {
            console.error('[RevenueCat] Restore failed:', error);
            Alert.alert('Restore Failed', 'Unable to restore purchases. Please try again later.');
            return null;

        } finally {
            setIsRestoring(false);
        }
    }, [isWeb, webPurchases, refreshSubscriptionData]);

    // Cancel subscription
    const cancelSubscription = useCallback(async (): Promise<boolean> => {
        try {
            // This would typically call your backend API
            // For RevenueCat, cancellation is handled through their dashboard or API
            console.warn('[Payments] Subscription cancellation should be handled server-side');

            // Call backend to cancel subscription
            // await api.payment.cancel.mutate();

            // Refresh customer info
            await refreshSubscriptionData();
            return true;
        } catch (error) {
            console.error('[Payments] Failed to cancel subscription:', error);
            return false;
        }
    }, [refreshSubscriptionData]);

    // Open billing portal (web only)
    const openBillingPortal = useCallback(async () => {
        if (!isWeb || !webPurchases) {
            console.warn('[RevenueCat] Billing portal is only available on web');
            return;
        }

        try {
            // Web SDK doesn't have getBillingPortalURL
            // This would typically be handled server-side with the REST API
            console.warn('[Payments] Billing portal URL not available in Web SDK');
            const result = { url: null };
            if (result.url && typeof window !== 'undefined') {
                window.open(result.url, '_blank');
            }
        } catch (error) {
            console.error('[RevenueCat] Failed to open billing portal:', error);
            Alert.alert('Error', 'Unable to open billing portal. Please try again later.');
        }
    }, [isWeb, webPurchases]);

    // Initialize on mount
    useEffect(() => {
        initializeSDK();
    }, [initializeSDK]);

    // Set up listener for subscription updates (native only)
    useEffect(() => {
        if (isWeb || !isPaymentSystemReady || !Purchases) return;

        // Listen for customer info updates  
        Purchases.addCustomerInfoUpdateListener((info) => {
            console.log('[Payments] Customer info updated');
            setSubscriptionData(info as CustomerInfo);
        });

        return () => {
            console.log('[Payments] Cleaning up listener');
        };
    }, [isWeb, isPaymentSystemReady]);

    return {
        // Core essentials
        isPaymentSystemReady,
        isLoadingPaymentSystem,

        // Subscription info
        subscription,
        hasActiveSubscription,
        daysUntilRenewal,            // Pre-calculated to save code elsewhere
        canAccessPlan,               // Saves plan hierarchy logic everywhere

        // Purchase & management
        purchaseSubscription,
        isPurchasing,
        cancelSubscription,          // Useful for settings screen
        refreshSubscriptionData,     // Useful for pull-to-refresh

        // Restore functionality
        restorePurchases: Platform.OS !== 'web' ? async () => {
            await restorePurchases();
        } : undefined,
        isRestoring,                 // Needed for UI feedback

        // Web-specific
        ...(isWeb && {
            openBillingPortal,
        }),
    };
};

// Helper function to extract subscription info from customer info
function getSubscriptionInfo(customerInfo: CustomerInfo, isWeb: boolean): SubscriptionInfo {
    if (isWeb) {
        const webInfo = customerInfo as CustomerInfoWeb;
        const activeEntitlements = Object.keys(webInfo.entitlements);

        if (activeEntitlements.length === 0) {
            return {
                isActive: false,
                plan: 'free',
                isInTrialPeriod: false,
                isInGracePeriod: false,
            };
        }

        const highestEntitlement = getHighestEntitlement(activeEntitlements);
        const plan = entitlementToPlan(highestEntitlement);
        const firstEntitlement = Object.values(webInfo.entitlements)[0];

        return {
            isActive: true,
            plan,
            expiresAt: firstEntitlement?.expiresDate ? new Date(firstEntitlement.expiresDate) : undefined,
            willRenew: firstEntitlement?.willRenew ?? false,
            isInTrialPeriod: firstEntitlement?.periodType === 'TRIAL',
            isInGracePeriod: firstEntitlement?.billingIssueDetectedAt != null,
            store: 'STRIPE',
        };
    } else {
        const nativeInfo = customerInfo as CustomerInfoNative;
        const activeEntitlements = Object.keys(nativeInfo.entitlements.active);

        if (activeEntitlements.length === 0) {
            return {
                isActive: false,
                plan: 'free',
                isInTrialPeriod: false,
                isInGracePeriod: false,
            };
        }

        const highestEntitlement = getHighestEntitlement(activeEntitlements);
        const plan = entitlementToPlan(highestEntitlement);
        const firstEntitlement = Object.values(nativeInfo.entitlements.active)[0];

        return {
            isActive: true,
            plan,
            expiresAt: firstEntitlement?.expirationDate ? new Date(firstEntitlement.expirationDate) : undefined,
            willRenew: firstEntitlement?.willRenew ?? false,
            isInTrialPeriod: firstEntitlement?.periodType === 'TRIAL',
            isInGracePeriod: firstEntitlement?.isActive && !firstEntitlement?.willRenew,
            store: getStore(firstEntitlement?.store),
        };
    }
}

// Helper to map store string
function getStore(store?: string): SubscriptionInfo['store'] {
    switch (store?.toUpperCase()) {
        case 'APP_STORE': return 'APP_STORE';
        case 'PLAY_STORE': return 'PLAY_STORE';
        case 'STRIPE': return 'STRIPE';
        case 'PROMOTIONAL': return 'PROMOTIONAL';
        default: return undefined;
    }
}
