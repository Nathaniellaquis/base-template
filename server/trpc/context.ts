import { connectDB } from '@/config/mongodb';
import { auth } from '@/config/firebase';
import { createUser, findUserByUid, setUserCustomClaims } from '@/services/user';
import { createLogger } from '@/utils/logging/logger';
import { User } from '@shared';
import { type CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { type Db } from 'mongodb';

const logger = createLogger('TRPC-Context');

export interface Context {
    user: User | null;
    firebaseToken: any | null; // Firebase DecodedIdToken
    db: Db;
}

export async function createContext({ req }: CreateExpressContextOptions): Promise<Context> {
    const token = req.headers.authorization?.replace('Bearer ', '');

    let user: User | null = null;
    let firebaseToken: any | null = null;

    // Ensure database is connected first
    const db = await connectDB();

    if (token) {
        try {
            // Verify Firebase token
            firebaseToken = await auth.verifyIdToken(token);

            // Always fetch full user from MongoDB for consistency
            const dbUser = await findUserByUid(firebaseToken.uid);

            if (dbUser) {
                user = dbUser;
            } else {
                // User doesn't exist - create them! (auto-recovery)
                try {
                    const newUser = await createUser({
                        uid: firebaseToken.uid,
                        email: firebaseToken.email!,
                    });

                    // Set custom claims for faster token verification in the future
                    await setUserCustomClaims(newUser.uid, newUser._id!);

                    user = newUser;
                } catch (error) {
                    // Continue without user - let routes handle the error
                    if (error instanceof Error) {
                        logger.error('Failed to create user', error);
                    } else {
                        logger.error('Failed to create user', String(error));
                    }
                }
            }
        } catch {
            // Invalid token, continue without user
        }
    }

    return { user, db, firebaseToken };
}