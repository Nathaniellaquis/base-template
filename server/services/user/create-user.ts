import { User } from '@shared/user';
import { getDb } from '../../db';

export async function createUser(data: {
    uid: string;
    email: string;
    displayName?: string;
}): Promise<User> {
    const db = await getDb();

    const newUser: Omit<User, '_id'> = {
        uid: data.uid,
        email: data.email,
        displayName: data.displayName || '',
        role: 'user',
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const result = await db.collection<User>('users').insertOne(newUser as User);

    return {
        ...newUser,
        _id: result.insertedId.toString(),
    };
} 