import { Workspace } from '@shared';
import { connectDB } from '@/config/mongodb';
import { ObjectId } from 'mongodb';

export async function listWorkspaces(userId: string): Promise<Workspace[]> {
  const db = await connectDB();
  
  const workspaces = await db.collection<Workspace>('workspaces')
    .find({ 'members.userId': userId })
    .toArray();
  
  return workspaces.map(ws => ({
    ...ws,
    _id: ws._id.toString()
  }));
}