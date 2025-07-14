import cors from 'cors';
import express from 'express';
import { config } from './config';
import { connectDB } from './db';
import { createTRPCMiddleware } from './trpc/app';

const app = express();

// Connect to MongoDB
connectDB();

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    next();
});

// tRPC middleware
app.use('/trpc', createTRPCMiddleware());

// Public endpoints
app.get('/ping', (req, res) => {
    res.json({ message: 'pong' });
});

app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from the API!' });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(config.port, () => {
    console.log(`✅ Server running on port ${config.port}`);
    console.log(`🚀 Environment: ${config.nodeEnv}`);
}); 