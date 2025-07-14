import { type CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { type Db } from 'mongodb';
import { CustomDecodedIdToken } from '../../types/firebase';
import { User } from '../../types/user';
import { getDb } from '../db';
import { auth } from '../firebase';
import { createUser, findUserByUid, setUserCustomClaims } from '../services/user';

export interface Context {
    user: User | null;
    firebaseToken: CustomDecodedIdToken | null;
    db: Db;
}

export async function createContext({ req }: CreateExpressContextOptions): Promise<Context> {
    const token = req.headers.authorization?.replace('Bearer ', '');

    let user: User | null = null;
    let firebaseToken: CustomDecodedIdToken | null = null;

    if (token) {
        try {
            // Firebase returns custom claims at the top level of the decoded token
            firebaseToken = await auth.verifyIdToken(token) as CustomDecodedIdToken;

            // Check if user has custom claims (mongoId)
            if (firebaseToken.mongoId) {
                // We have the mongoId in the token - no DB query needed!
                user = {
                    uid: firebaseToken.uid,
                    email: firebaseToken.email!,
                    _id: firebaseToken.mongoId,
                    role: 'user', // Role comes from DB, not custom claims
                    emailVerified: firebaseToken.email_verified || false,
                    displayName: firebaseToken.name,
                };
            } else {
                // No custom claims - check if user exists in MongoDB
                const dbUser = await findUserByUid(firebaseToken.uid);

                if (dbUser) {
                    user = dbUser;
                } else {
                    // User doesn't exist - create them! (auto-recovery)
                    try {
                        const newUser = await createUser({
                            uid: firebaseToken.uid,
                            email: firebaseToken.email!,
                            displayName: firebaseToken.name,
                        });

                        // Set custom claims for future requests
                        await setUserCustomClaims(newUser.uid, newUser._id!);

                        user = newUser;
                    } catch (error) {
                        // Continue without user - let routes handle the error
                    }
                }
            }
        } catch {
            // Invalid token, continue without user
        }
    }

    const db = await getDb();
    return { user, db, firebaseToken };
} 