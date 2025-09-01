/**
 * RevenueCat Customer Operations
 * Handle customer-related API calls
 */

import { getRevenueCatClient } from '@/config/revenuecat';
import { logger } from '@/utils/logging';
import type { RevenueCatCustomerInfo } from '@shared/revenuecat';

/**
 * Get customer information from RevenueCat
 */
export async function getCustomer(appUserId: string): Promise<RevenueCatCustomerInfo | null> {
    const client = getRevenueCatClient();

    try {
        const response = await client.get(`/subscribers/${appUserId}`);
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 404) {
            logger.info('[RevenueCat] Customer not found', { appUserId });
            return null;
        }
        logger.error('[RevenueCat] Error fetching customer', { error: error.message, appUserId });
        throw error;
    }
}
