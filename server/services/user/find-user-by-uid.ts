import { User } from '@shared/user';
import { getDb } from '../../db';

export async function findUserByUid(uid: string): Promise<User | null> {
    const db = await getDb();
    return db.collection<User>('users').findOne({ uid });
} 