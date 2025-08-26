/**
 * Stripe Configuration
 * Uses factory pattern to avoid circular dependencies
 */

export interface StripeConfig {
  publishableKey: string;
  merchantId: string;
  merchantDisplayName: string;
  currency: string;
  countryCode: string;
}

export interface StripeConfigOptions {
  publishableKey: string;
  merchantId: string;
  isDevelopment: boolean;
}

/**
 * Factory function to create Stripe configuration
 * @param options - Configuration options from main config
 * @returns Complete Stripe configuration
 */
export function createStripeConfig(options: StripeConfigOptions): StripeConfig {
  return {
    publishableKey: options.publishableKey,
    merchantId: options.merchantId,
    merchantDisplayName: 'INGRD',
    currency: 'USD',
    countryCode: 'US',
  };
}

/**
 * Factory function to create payment sheet configuration
 * @param stripeConfig - Stripe configuration object
 * @param isDevelopment - Whether in development mode
 * @returns Payment sheet configuration
 */
export function createPaymentSheetConfig(stripeConfig: StripeConfig, isDevelopment: boolean) {
  return {
    merchantDisplayName: stripeConfig.merchantDisplayName,
    allowsDelayedPaymentMethods: true,
    defaultBillingDetails: {
      name: 'Guest User',
    },
    googlePay: {
      merchantCountryCode: stripeConfig.countryCode,
      currencyCode: stripeConfig.currency,
      testEnv: isDevelopment,
    },
    applePay: {
      merchantCountryCode: stripeConfig.countryCode,
    },
    style: 'alwaysDark' as const,
  };
}

/**
 * Validation function for Stripe configuration
 * @param config - Stripe configuration to validate
 * @returns Whether configuration is valid
 */
export function validateStripeConfig(config: StripeConfig): boolean {
  const required: (keyof StripeConfig)[] = ['publishableKey', 'merchantId'];
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    console.error(`Missing Stripe configuration: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
}