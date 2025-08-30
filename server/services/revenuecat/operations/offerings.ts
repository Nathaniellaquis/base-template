/**
 * RevenueCat Offerings Operations
 * Handle offerings and products API calls
 */

import { getRevenueCatClient } from '@/config/revenuecat';

/**
 * Get available offerings from RevenueCat
 */
export async function getOfferings(): Promise<any> {
    const client = getRevenueCatClient();
    
    try {
        const response = await client.get('/subscribers/$RCAnonymousID/offerings');
        return response.data;
    } catch (error: any) {
        console.error(`[RevenueCat] Error fetching offerings:`, error.message);
        throw error;
    }
}
