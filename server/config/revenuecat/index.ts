/**
 * RevenueCat Configuration
 * Central configuration for RevenueCat API
 */

import axios, { AxiosInstance } from 'axios';

export interface RevenueCatConfig {
    apiKey: string;
    baseURL: string;
    timeout: number;
    webhookSecret?: string;
}

/**
 * Get RevenueCat configuration from environment
 */
export function getRevenueCatConfig(): RevenueCatConfig {
    const apiKey = process.env.REVENUECAT_SECRET_KEY;
    
    if (!apiKey) {
        throw new Error('REVENUECAT_SECRET_KEY not configured');
    }

    return {
        apiKey,
        baseURL: process.env.REVENUECAT_API_URL || 'https://api.revenuecat.com/v1',
        timeout: parseInt(process.env.REVENUECAT_TIMEOUT || '30000', 10),
        webhookSecret: process.env.REVENUECAT_WEBHOOK_SECRET,
    };
}

/**
 * Create configured Axios instance for RevenueCat API
 */
export function createRevenueCatClient(config: RevenueCatConfig): AxiosInstance {
    return axios.create({
        baseURL: config.baseURL,
        headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
        },
        timeout: config.timeout,
    });
}

// Singleton instance
let clientInstance: AxiosInstance | null = null;

/**
 * Get or create RevenueCat API client instance
 */
export function getRevenueCatClient(): AxiosInstance {
    if (!clientInstance) {
        const config = getRevenueCatConfig();
        clientInstance = createRevenueCatClient(config);
    }
    return clientInstance;
}

/**
 * Validate RevenueCat configuration
 */
export function validateRevenueCatConfig(): boolean {
    try {
        const config = getRevenueCatConfig();
        return !!config.apiKey;
    } catch {
        return false;
    }
}
