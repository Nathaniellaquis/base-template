import dotenv from 'dotenv';
import Joi from 'joi';
import path from 'path';

// Load environment variables from the parent directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Environment validation schema
const envSchema = Joi.object({
    PORT: Joi.number().default(3000),
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    MONGODB_URI: Joi.string().required(),
    FIREBASE_PROJECT_ID: Joi.string().required(),
    // Either service account path or JSON credentials
    GOOGLE_APPLICATION_CREDENTIALS: Joi.string().optional(),
    FIREBASE_ADMIN_CREDENTIALS: Joi.string().optional(),
}).unknown();

// Validate environment variables
const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
    console.error('❌ Environment validation error:', error.message);
    console.error('Missing required environment variables:', error.details);
    process.exit(1);
}

// Type-safe config object
interface Config {
    port: number;
    nodeEnv: 'development' | 'production' | 'test';
    mongodb: {
        uri: string;
        dbName: string;
        collections: {
            user: string;
        };
    };
    firebase: {
        projectId: string;
        adminCredentialsPath?: string;
        adminCredentialsJson?: string;
    };
}

// Export config
export const config: Config = {
    port: envVars.PORT,
    nodeEnv: envVars.NODE_ENV,
    mongodb: {
        uri: envVars.MONGODB_URI,
        dbName: 'base-template',
        collections: {
            user: 'user',
        },
    },
    firebase: {
        projectId: envVars.FIREBASE_PROJECT_ID,
        adminCredentialsPath: envVars.GOOGLE_APPLICATION_CREDENTIALS,
        adminCredentialsJson: envVars.FIREBASE_ADMIN_CREDENTIALS,
    },
};
