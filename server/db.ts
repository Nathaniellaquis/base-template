import { Collection, Db, MongoClient } from 'mongodb';
import { config } from './config';

// Global variables to store connection
let client: MongoClient | null = null;
let db: Db | null = null;

// Create indexes for collections
async function createIndexes(database: Db) {
    try {
        // Create unique index on uid to prevent duplicates
        await database.collection('users').createIndex(
            { uid: 1 },
            { unique: true }
        );

        // Create index on email for faster lookups
        await database.collection('users').createIndex({ email: 1 });

        // Database indexes created
    } catch (error) {
        // Error creating indexes
    }
}

// Connect to MongoDB
export const connectDB = async (): Promise<Db> => {
    if (db) return db;

    try {
        client = new MongoClient(config.mongodb.uri);
        await client.connect();

        db = client.db(config.mongodb.dbName);
        // Create indexes
        await createIndexes(db);
        console.log('✅ [MongoDB] Connected & Created Indexes');
        return db;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// Get database instance
export const getDB = (): Db => {
    if (!db) {
        throw new Error('Database not initialized. Call connectDB() first.');
    }
    return db;
};

// Export alias for consistency
export const getDb = getDB;

// User collection
export const getUserCollection = (): Collection => {
    return getDB().collection(config.mongodb.collections.user);
};

// Graceful shutdown
export const closeDB = async (): Promise<void> => {
    if (client) {
        await client.close();
        client = null;
        db = null;
        // MongoDB connection closed
    }
};

// Handle process termination
process.on('SIGINT', async () => {
    await closeDB();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await closeDB();
    process.exit(0);
});
