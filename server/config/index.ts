/**
 * Server Configuration Module
 * Centralized configuration exports
 */

import dotenv from 'dotenv';
import Joi from 'joi';
import path from 'path';
import { createLogger } from '../utils/logging/logger';

const logger = createLogger('Config');

// Load environment variables from the parent directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Environment validation schema
const envSchema = Joi.object({
    // Server
    PORT: Joi.number().default(3000),
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    
    // Database
    MONGODB_URI: Joi.string().required(),
    
    // Firebase
    FIREBASE_PROJECT_ID: Joi.string().required(),
    FIREBASE_ADMIN_CREDENTIALS: Joi.string().required(),
    
    // Stripe
    STRIPE_SECRET_KEY: Joi.string().required(),
    STRIPE_WEBHOOK_SECRET: Joi.string().required(),
    STRIPE_PRICE_BASIC_MONTHLY: Joi.string().required(),
    STRIPE_PRICE_BASIC_YEARLY: Joi.string().required(),
    STRIPE_PRICE_PRO_MONTHLY: Joi.string().required(),
    STRIPE_PRICE_PRO_YEARLY: Joi.string().required(),
    STRIPE_PRICE_ENTERPRISE_MONTHLY: Joi.string().required(),
    STRIPE_PRICE_ENTERPRISE_YEARLY: Joi.string().required(),
    STRIPE_PORTAL_RETURN_URL: Joi.string().default('http://localhost:3000/settings'),
    STRIPE_SUCCESS_URL: Joi.string().default('http://localhost:3000/payment/success'),
    STRIPE_CANCEL_URL: Joi.string().default('http://localhost:3000/payment/cancel'),
}).unknown();

// Validate environment variables
const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
    logger.error('Environment validation error:', error.message);
    logger.error('Missing required environment variables:', error.details.map(d => ({
        message: d.message,
        path: d.path,
        type: d.type
    })));
    process.exit(1);
}

// Type-safe config object
interface Config {
    port: number;
    nodeEnv: 'development' | 'production' | 'test';
    isDevelopment: boolean;
    isProduction: boolean;
    isTest: boolean;
    mongodb: {
        uri: string;
        dbName: string;
        collections: {
            user: string;
        };
    };
    firebase: {
        projectId: string;
        adminCredentialsJson: string;
    };
    stripe: {
        secretKey: string;
        webhookSecret: string;
        prices: {
            basic: {
                monthly: string;
                yearly: string;
            };
            pro: {
                monthly: string;
                yearly: string;
            };
            enterprise: {
                monthly: string;
                yearly: string;
            };
        };
        urls: {
            portalReturn: string;
            success: string;
            cancel: string;
        };
    };
}

// Export config
export const config: Config = {
    port: envVars.PORT,
    nodeEnv: envVars.NODE_ENV,
    isDevelopment: envVars.NODE_ENV === 'development',
    isProduction: envVars.NODE_ENV === 'production',
    isTest: envVars.NODE_ENV === 'test',
    mongodb: {
        uri: envVars.MONGODB_URI,
        dbName: 'base-template',
        collections: {
            user: 'user',
        },
    },
    firebase: {
        projectId: envVars.FIREBASE_PROJECT_ID,
        adminCredentialsJson: envVars.FIREBASE_ADMIN_CREDENTIALS,
    },
    stripe: {
        secretKey: envVars.STRIPE_SECRET_KEY,
        webhookSecret: envVars.STRIPE_WEBHOOK_SECRET,
        prices: {
            basic: {
                monthly: envVars.STRIPE_PRICE_BASIC_MONTHLY,
                yearly: envVars.STRIPE_PRICE_BASIC_YEARLY,
            },
            pro: {
                monthly: envVars.STRIPE_PRICE_PRO_MONTHLY,
                yearly: envVars.STRIPE_PRICE_PRO_YEARLY,
            },
            enterprise: {
                monthly: envVars.STRIPE_PRICE_ENTERPRISE_MONTHLY,
                yearly: envVars.STRIPE_PRICE_ENTERPRISE_YEARLY,
            },
        },
        urls: {
            portalReturn: envVars.STRIPE_PORTAL_RETURN_URL,
            success: envVars.STRIPE_SUCCESS_URL,
            cancel: envVars.STRIPE_CANCEL_URL,
        },
    },
};

// Export Firebase configuration and services
export * from './firebase';

// Export MongoDB configuration and services
export * from './mongodb';

// Export Stripe configuration
export * from './stripe';