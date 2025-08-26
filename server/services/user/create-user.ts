import { User } from '@shared';
import { getUserCollection } from '@/config/mongodb';
import { ObjectId } from 'mongodb';

export async function createUser(data: {
    uid: string;
    email: string;
}): Promise<User> {
    const usersCollection = getUserCollection();

    const newUser = {
        _id: new ObjectId(),
        uid: data.uid,
        email: data.email,
        displayName: '',
        role: 'user' as const,
        emailVerified: false,
        onboardingCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    await usersCollection.insertOne(newUser);

    return {
        ...newUser,
        _id: newUser._id.toString(),
    };
} 