import { getUserCollection } from '@/config/mongodb';
import { mongoDocToUser } from '@/utils/database/mongodb';

export async function findUserByUid(uid: string) {
    const usersCollection = getUserCollection();
    const userDoc = await usersCollection.findOne({ uid });
    
    if (!userDoc) {
        return null;
    }
    
    return mongoDocToUser(userDoc);
} 