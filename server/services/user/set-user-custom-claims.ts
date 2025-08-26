import { auth } from '@/config/firebase';

export async function setUserCustomClaims(uid: string, mongoId: string) {
    await auth.setCustomUserClaims(uid, {
        mongoId,
    });
} 