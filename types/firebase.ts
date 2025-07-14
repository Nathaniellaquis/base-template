import { DecodedIdToken } from 'firebase-admin/auth';

// Extend Firebase's DecodedIdToken to include our custom claims
export interface CustomDecodedIdToken extends DecodedIdToken {
    // Our custom claims
    mongoId?: string;

    // Standard Firebase fields we use
    email?: string;
    email_verified?: boolean;
    name?: string;
} 