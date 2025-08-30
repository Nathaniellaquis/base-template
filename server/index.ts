import { config } from '@/config';
import { connectDB } from '@/config/mongodb';
import {
    errorTrackingMiddleware,
    notFoundHandler,
    performanceMiddleware,
    setupUnhandledRejectionTracking
} from '@/middleware/error-tracking';
import { createTRPCMiddleware } from '@/trpc/app';
import { analytics } from '@/utils/analytics';
import { createLogger } from '@/utils/logging/logger';
import revenueCatWebhookRouter from '@/webhooks/revenuecat';
import cors from 'cors';
import express from 'express';

const logger = createLogger('Server');

const app = express();

// Set up unhandled rejection tracking
setupUnhandledRejectionTracking();

// Connect to MongoDB
connectDB();

app.use(cors());

// Performance monitoring (only tracks slow requests)
app.use(performanceMiddleware);

// RevenueCat webhook needs JSON body but applied before express.json()
app.use('/webhooks/revenuecat', express.json({
    verify: (req, res, buf) => {
        // Store raw body for signature verification
        (req as any).rawBody = buf.toString('utf-8');
    }
}), revenueCatWebhookRouter);

// JSON middleware for other routes
app.use(express.json());

// Request logging middleware (now includes tracking)
app.use((req, res, next) => {
    // Skip logging for health checks
    if (req.path !== '/ping' && req.path !== '/health') {
        logger.info(`${req.method} ${req.path}`);
    }
    next();
});

// tRPC middleware
app.use('/trpc', createTRPCMiddleware());

// Health check endpoints
app.get('/ping', (req, res) => {
    res.json({ message: 'pong' });
});

app.get('/health', async (req, res) => {
    // Check database connection
    const { getDb } = await import('@/db');
    const db = getDb();

    try {
        await db.admin().ping();
        res.json({
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        // Only track health check failures (negative event)
        analytics.trackError(error, {
            path: '/health',
            type: 'health_check_failed',
            severity: 'critical' // Database down is critical
        });
        res.status(503).json({
            status: 'unhealthy',
            database: 'disconnected',
            timestamp: new Date().toISOString()
        });
    }
});

app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from the API!' });
});

// 404 handler (must be before error handler)
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorTrackingMiddleware);

const server = app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    // Server start doesn't need tracking - it's not a negative event
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, starting graceful shutdown');

    // Close server
    server.close(async () => {
        logger.info('HTTP server closed');

        // Shutdown analytics
        await analytics.shutdown();

        // Close database connection
        const { closeDB } = await import('@/db');
        await closeDB();

        process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        // This IS a negative event - forced shutdown indicates a problem
        analytics.trackError(new Error('Forced shutdown after timeout'), {
            type: 'forced_shutdown',
            uptime: process.uptime(),
            severity: 'high'
        });
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
}); 