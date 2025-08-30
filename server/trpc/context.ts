import { connectDB } from '@/config/mongodb';
import { auth } from '@/config/firebase';
import { config } from '@/config';
import { createUser, findUserByUid, setUserCustomClaims } from '@/services/user';
import { createLogger } from '@/utils/logging/logger';
import { User, Workspace } from '@shared';
import { type CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { type Db, ObjectId } from 'mongodb';

const logger = createLogger('TRPC-Context');

export interface Context {
    user: User | null;
    firebaseToken: any | null; // Firebase DecodedIdToken
    db: Db;
    // Workspace fields - only present when feature enabled
    workspace?: Workspace;
    workspaceId?: string;
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

    // Base context
    const context: Context = { user, db, firebaseToken };

    // Add workspace context if feature is enabled and user is authenticated
    if (config.enableWorkspaces && user) {
        const workspaceId = req.headers['x-workspace-id'] as string || user.currentWorkspaceId;
        
        if (workspaceId) {
            // Verify user has access to this workspace
            const workspace = await db.collection('workspaces').findOne({
                _id: new ObjectId(workspaceId),
                'members.userId': user._id
            }) as Workspace | null;
            
            if (workspace) {
                context.workspace = workspace;
                context.workspaceId = workspaceId;
            }
        }
    }

    return context;
}