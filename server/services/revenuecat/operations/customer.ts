/**
 * RevenueCat Customer Operations
 * Handle customer-related API calls
 */

import { getRevenueCatClient } from '@/config/revenuecat';
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
            console.log(`[RevenueCat] Customer not found: ${appUserId}`);
            return null;
        }
        console.error(`[RevenueCat] Error fetching customer:`, error.message);
        throw error;
    }
}

/**
 * Delete a customer from RevenueCat
 */
export async function deleteCustomer(appUserId: string): Promise<void> {
    const client = getRevenueCatClient();
    
    try {
        await client.delete(`/subscribers/${appUserId}`);
        console.log(`[RevenueCat] Customer deleted: ${appUserId}`);
    } catch (error: any) {
        console.error(`[RevenueCat] Error deleting customer:`, error.message);
        throw error;
    }
}

/**
 * Update customer attributes in RevenueCat
 */
export async function updateCustomerAttributes(
    appUserId: string, 
    attributes: Record<string, any>
): Promise<void> {
    const client = getRevenueCatClient();
    
    try {
        await client.post(
            `/subscribers/${appUserId}/attributes`,
            { attributes }
        );
        console.log(`[RevenueCat] Customer attributes updated: ${appUserId}`);
    } catch (error: any) {
        console.error(`[RevenueCat] Error updating attributes:`, error.message);
        throw error;
    }
}
