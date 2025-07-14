import { createUserSchema } from '@shared/user';
import { TRPCError } from '@trpc/server';
import {
    createUser as createUserInDb,
    findUserByUid,
    setUserCustomClaims
} from '../../services/user';
import { publicProcedure } from '../../trpc/trpc';

export const createUser = publicProcedure
    .input(createUserSchema)
    .mutation(async ({ ctx, input }) => {
        // Get the Firebase token from context
        const firebaseToken = ctx.firebaseToken;
        if (!firebaseToken) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: 'No Firebase token found',
            });
        }

        // Check if user already exists
        const existing = await findUserByUid(firebaseToken.uid);
        if (existing) {
            // User already exists (might have been auto-created)
            // Update display name if different
            if (input.displayName && input.displayName !== existing.displayName) {
                // For now, just return existing user
                // Could add update logic here if needed
            }
            return existing;
        }

        // Create the user (explicit creation via endpoint)
        const user = await createUserInDb({
            uid: firebaseToken.uid,
            email: firebaseToken.email!,
            displayName: input.displayName,
        });

        // Set custom claims with MongoDB ID
        await setUserCustomClaims(user.uid, user._id!);

        return user;
    }); 