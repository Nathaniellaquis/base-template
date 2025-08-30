/**
 * RevenueCat Subscription Operations
 * Handle subscription-related API calls
 */

import { getRevenueCatClient } from '@/config/revenuecat';

/**
 * Revoke a subscription for a customer
 */
export async function revokeSubscription(
    appUserId: string, 
    productId: string
): Promise<void> {
    const client = getRevenueCatClient();
    
    try {
        await client.post(
            `/subscribers/${appUserId}/subscriptions/${productId}/revoke`
        );
        console.log(`[RevenueCat] Subscription revoked: ${appUserId} - ${productId}`);
    } catch (error: any) {
        console.error(`[RevenueCat] Error revoking subscription:`, error.message);
        throw error;
    }
}

/**
 * Grant promotional entitlement to a customer
 */
export async function grantPromotionalEntitlement(
    appUserId: string,
    entitlementId: string,
    duration: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'lifetime' = 'monthly'
): Promise<any> {
    const client = getRevenueCatClient();
    
    try {
        const response = await client.post(
            `/subscribers/${appUserId}/entitlements/${entitlementId}/promotional`,
            { duration }
        );
        console.log(`[RevenueCat] Promotional entitlement granted: ${appUserId} - ${entitlementId}`);
        return response.data;
    } catch (error: any) {
        console.error(`[RevenueCat] Error granting entitlement:`, error.message);
        throw error;
    }
}
