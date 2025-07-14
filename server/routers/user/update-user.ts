import { updateUserSchema, User } from '@shared/user';
import { TRPCError } from '@trpc/server';
import { ObjectId } from 'mongodb';
import { getDb } from '../../db';
import { protectedProcedure } from '../../trpc/trpc';

export const updateUser = protectedProcedure
    .input(updateUserSchema)
    .mutation(async ({ ctx, input }) => {
        // Validate the user exists (should always be true if context works)
        if (!ctx.user._id) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'User not found',
            });
        }

        // Update the user directly here
        const db = await getDb();

        const result = await db.collection<User>('users').findOneAndUpdate(
            { _id: new ObjectId(ctx.user._id) } as any,
            {
                $set: {
                    ...input,
                    updatedAt: new Date(),
                }
            },
            { returnDocument: 'after' }
        );

        if (!result) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to update user',
            });
        }

        return {
            ...result,
            _id: result._id?.toString(),
        };
    }); 