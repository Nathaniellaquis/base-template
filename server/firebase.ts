import * as admin from 'firebase-admin';
import { config } from './config';

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
    // Use Application Default Credentials if available (Google Cloud environments)
    if (config.firebase.adminCredentialsPath || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // Firebase Admin SDK will automatically use GOOGLE_APPLICATION_CREDENTIALS
        admin.initializeApp({
            projectId: config.firebase.projectId,
        });
    } else if (config.firebase.adminCredentialsJson) {
        // Use provided JSON credentials
        const serviceAccount = JSON.parse(config.firebase.adminCredentialsJson);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } else {
        // Try to initialize with default credentials (useful for Google Cloud environments)
        admin.initializeApp({
            projectId: config.firebase.projectId,
        });
    }
}

// Export only what we actually use
export const auth = admin.auth();