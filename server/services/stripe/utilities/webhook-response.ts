/**
 * Standard webhook response builders
 * Ensures consistent response format across all webhook handlers
 */

export interface WebhookResponse {
  success: boolean;
  userId?: string;
  message: string;
}

/**
 * Build successful webhook response
 */
export function webhookSuccess(message: string, userId?: string): WebhookResponse {
  return {
    success: true,
    userId,
    message
  };
}

/**
 * Build error webhook response
 */
export function webhookError(message: string): WebhookResponse {
  return {
    success: false,
    message
  };
}