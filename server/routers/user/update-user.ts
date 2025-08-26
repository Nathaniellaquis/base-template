import { updateUserSchema } from '@shared';
import { ObjectId } from 'mongodb';
import { getUserCollection } from '@/config/mongodb';
import { protectedProcedure } from '@/trpc/trpc';
import { mongoDocToUser } from '@/utils/database/mongodb';
import { errors } from '@/utils/errors';
import { calculateProfileCompleteness } from '@/services/user';

export const updateUser = protectedProcedure
    .input(updateUserSchema)
    .mutation(async ({ ctx, input }) => {
        // Validate the user exists (should always be true if context works)
        if (!ctx.user._id) {
            throw errors.notFound('User');
        }

        // Update the user
        const usersCollection = getUserCollection();

        // First, get the current user to merge with updates
        const currentUser = await usersCollection.findOne({ _id: new ObjectId(ctx.user._id) });
        if (!currentUser) {
            throw errors.notFound('User');
        }

        // Merge updates with current user
        const updatedUserData = { ...currentUser, ...input };
        
        // Calculate profile completeness
        const profileCompleteness = calculateProfileCompleteness(updatedUserData as any);

        const updatedUserResult = await usersCollection.findOneAndUpdate(
            { _id: new ObjectId(ctx.user._id) },
            {
                $set: {
                    ...input,
                    profileCompleteness,
                    lastProfileUpdate: new Date(),
                    updatedAt: new Date(),
                }
            },
            { returnDocument: 'after' }
        );

        if (!updatedUserResult) {
            throw errors.internal('Failed to update user');
        }

        return mongoDocToUser(updatedUserResult);
    }); 