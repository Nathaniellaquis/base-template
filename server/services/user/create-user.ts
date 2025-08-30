import { User } from '@shared';
import { getUserCollection } from '@/config/mongodb';
import { config } from '@/config';
import { ObjectId } from 'mongodb';

export async function createUser(data: {
    uid: string;
    email: string;
}): Promise<User> {
    const usersCollection = getUserCollection();

    // Create user base data
    const userId = new ObjectId();

    const newUser = {
        _id: userId,
        uid: data.uid,
        email: data.email,
        displayName: '',
        role: 'user' as const,
        emailVerified: false,
        onboardingCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Initialize empty workspace fields if workspaces enabled
        // User will create/join workspace during onboarding
        ...(config.enableWorkspaces && {
            currentWorkspaceId: undefined,
            workspaces: []
        })
    };

    await usersCollection.insertOne(newUser);

    return {
        ...newUser,
        _id: newUser._id.toString(),
    };
} 