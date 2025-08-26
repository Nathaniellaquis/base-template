// Re-export the enhanced native payment hook functionality
// This maintains backward compatibility while providing enhanced features
export { useNativePayment as usePaymentConfirmation } from './useNativePayment';

// For components that specifically need the enhanced features
export { useNativePayment } from './useNativePayment';