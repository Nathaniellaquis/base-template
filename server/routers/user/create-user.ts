import { createUserSchema } from '@shared';
import { TRPCError } from '@trpc/server';
import {
    createUser as createUserInDb,
    findUserByUid,
    setUserCustomClaims
} from '@/services/user';
import { publicProcedure } from '@/trpc/trpc';

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
        const existingUser = await findUserByUid(firebaseToken.uid);
        if (existingUser) {
            // User already exists (might have been auto-created)
            return existingUser;
        }

        // Create the user (explicit creation via endpoint)
        const user = await createUserInDb({
            uid: firebaseToken.uid,
            email: firebaseToken.email!,
        });

        // Set custom claims with MongoDB ID
        await setUserCustomClaims(user.uid, user._id!);

        return user;
    }); 