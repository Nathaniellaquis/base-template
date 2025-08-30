import { Workspace } from '@shared';
import { connectDB } from '@/config/mongodb';
import { ObjectId } from 'mongodb';

export async function createWorkspace(
  userId: string,
  name: string
): Promise<Workspace> {
  const db = await connectDB();
  
  const workspace: Workspace = {
    _id: new ObjectId().toString(),
    name,
    ownerId: userId,
    members: [{
      userId,
      role: 'owner',
      joinedAt: new Date()
    }],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Insert workspace
  await db.collection<Workspace>('workspaces').insertOne({
    ...workspace,
    _id: new ObjectId(workspace._id)
  } as any);
  
  // Update user's workspaces array and current workspace
  await db.collection('users').updateOne(
    { _id: new ObjectId(userId) },
    { 
      $set: { currentWorkspaceId: workspace._id },
      $push: { 
        workspaces: {
          workspaceId: workspace._id,
          role: 'owner',
          joinedAt: new Date()
        } as any
      }
    }
  );
  
  return workspace;
}