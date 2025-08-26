import { config } from '@/config';

// Simple logger utility
export const createLogger = (name: string) => ({
  info: (message: string, data?: any) => {
    console.log(`[${name}] ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[${name}] ${message}`, error || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[${name}] ${message}`, data || '');
  },
  debug: (message: string, data?: any) => {
    if (config.isDevelopment) {
      console.log(`[${name}] ${message}`, data || '');
    }
  }
});

// Default logger
export const logger = createLogger('App');