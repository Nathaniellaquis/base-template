import { updateUserSchema } from '@shared';
import { ObjectId } from 'mongodb';
import { getUserCollection } from '@/config/mongodb';
import { protectedProcedure } from '@/trpc/trpc';
import { mongoDocToUser } from '@/utils/database/mongodb';
import { errors } from '@/utils/errors';

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


        const updatedUserResult = await usersCollection.findOneAndUpdate(
            { _id: new ObjectId(ctx.user._id) },
            {
                $set: {
                    ...input,
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