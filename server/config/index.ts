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

    // RevenueCat
    REVENUECAT_SECRET_KEY: Joi.string().required(),
    REVENUECAT_WEBHOOK_SECRET: Joi.string().optional().allow(''),
    REVENUECAT_API_URL: Joi.string().default('https://api.revenuecat.com/v1'),
    REVENUECAT_TIMEOUT: Joi.string().default('30000'),
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
    enableWorkspaces: boolean;
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
    revenuecat: {
        secretKey: string;
        webhookSecret?: string;
        apiUrl: string;
        timeout: number;
    };
}

// Export config
export const config: Config = {
    port: envVars.PORT,
    nodeEnv: envVars.NODE_ENV,
    isDevelopment: envVars.NODE_ENV === 'development',
    isProduction: envVars.NODE_ENV === 'production',
    isTest: envVars.NODE_ENV === 'test',
    enableWorkspaces: true, // Hardcoded - change this to enable/disable workspaces
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
    revenuecat: {
        secretKey: envVars.REVENUECAT_SECRET_KEY,
        webhookSecret: envVars.REVENUECAT_WEBHOOK_SECRET,
        apiUrl: envVars.REVENUECAT_API_URL,
        timeout: parseInt(envVars.REVENUECAT_TIMEOUT, 10),
    },
};

// Export Firebase configuration and services
export * from './firebase';

// Export MongoDB configuration and services
export * from './mongodb';

// Export RevenueCat configuration
export * from './revenuecat';
