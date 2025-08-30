# Backend Error Tracking Guide

## Overview

Comprehensive error tracking implementation for the Node.js/Express backend with PostHog integration, providing detailed insights into server-side errors, performance issues, and system health.

## Architecture

### Components

1. **Analytics Client** (`/server/utils/analytics.ts`)
   - PostHog integration for event tracking
   - Error categorization and severity assessment
   - Performance monitoring
   - Payment and authentication tracking

2. **Error Middleware** (`/server/middleware/error-tracking.ts`)
   - Express error handling middleware
   - Request/response tracking
   - Unhandled rejection capture
   - 404 tracking

3. **tRPC Integration** (`/server/trpc/trpc.ts`)
   - Procedure execution tracking
   - Authentication failure monitoring
   - Performance metrics per procedure

## Error Categories

The system automatically categorizes errors:

- **Database**: MongoDB connection issues, query failures
- **Authentication**: Invalid tokens, unauthorized access
- **Validation**: Input validation errors, bad requests
- **Network**: Timeouts, connection refused
- **Payment**: RevenueCat errors, subscription failures
- **Rate Limiting**: Too many requests
- **Permission**: Forbidden access, insufficient privileges

## Severity Levels

Errors are classified by severity:

- **Critical**: Database down, out of memory, fatal errors
- **High**: Payment failures, security issues, auth failures
- **Medium**: General application errors
- **Low**: Validation errors, 404s, bad requests

## Implementation Details

### Express Middleware Setup

```typescript
// Request tracking - tracks all API requests
app.use(requestTrackingMiddleware);

// Your routes here
app.use('/trpc', createTRPCMiddleware());

// 404 handler
app.use(notFoundHandler);

// Error tracking (must be last)
app.use(errorTrackingMiddleware);
```

### tRPC Error Tracking

All tRPC procedures automatically track:
- Execution time
- Success/failure status
- User context
- Input parameters (sanitized)

```typescript
// Automatically tracked
const myProcedure = protectedProcedure
  .input(schema)
  .mutation(async ({ ctx, input }) => {
    // Your logic here
    // Errors are automatically tracked
  });
```

### Manual Error Tracking

```typescript
import { analytics } from '@/utils/analytics';

// Track custom errors
try {
  // Your code
} catch (error) {
  analytics.trackError(error, {
    userId: user._id,
    context: 'custom_operation',
    metadata: { /* additional data */ }
  });
  throw error;
}

// Track custom events
analytics.track('custom_event', userId, {
  property1: 'value1',
  property2: 'value2'
});
```

## Tracked Events

### System Events

- `server_started`: Server initialization
- `server_shutdown`: Graceful shutdown
- `health_check_failed`: Database connectivity issues

### API Events

- `api_request`: All HTTP requests
- `slow_api_request`: Requests > 1 second
- `404_error`: Not found routes

### tRPC Events

- `trpc_procedure`: All procedure executions
- `trpc_error`: Procedure failures

### Database Events

- `database_operation`: CRUD operations
- `slow_database_query`: Queries > 500ms

### Authentication Events

- `auth_login`: Successful logins
- `auth_logout`: User logouts
- `auth_signup`: New registrations
- `auth_token_invalid`: Invalid token attempts
- `auth_token_refresh`: Token refreshes
- `admin_access_denied`: Unauthorized admin access

### Payment Events

- `payment_subscription_created`: New subscriptions
- `payment_subscription_updated`: Plan changes
- `payment_subscription_cancelled`: Cancellations
- `payment_failed`: Failed payments
- `revenue`: Successful revenue events

### Error Events

- `backend_error`: All backend errors
- `error_[category]`: Categorized errors (e.g., `error_database`)
- `unhandledRejection`: Unhandled promise rejections
- `uncaughtException`: Uncaught exceptions

## Performance Monitoring

### Request Performance

```typescript
// Automatically tracked for all requests
{
  path: '/api/endpoint',
  method: 'GET',
  statusCode: 200,
  duration: 145, // milliseconds
  userId: 'user_123'
}
```

### Database Performance

```typescript
// Slow queries automatically flagged
{
  operation: 'find',
  collection: 'users',
  duration: 650, // milliseconds
  success: true
}
```

### tRPC Performance

```typescript
// Procedure execution metrics
{
  procedure: 'user.update',
  type: 'mutation',
  duration: 230,
  success: true
}
```

## Error Context

Each error includes comprehensive context:

```typescript
{
  // Error details
  message: 'Database connection failed',
  stack: '...',
  category: 'database',
  severity: 'critical',
  
  // Request context
  userId: 'user_123',
  path: '/api/users',
  method: 'GET',
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  
  // System context
  environment: 'production',
  serverVersion: '1.0.0',
  timestamp: '2024-01-01T12:00:00Z'
}
```

## Health Monitoring

### Health Check Endpoint

```bash
GET /health

# Healthy response
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-01T12:00:00Z"
}

# Unhealthy response (503)
{
  "status": "unhealthy",
  "database": "disconnected",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### Graceful Shutdown

The server handles graceful shutdown:
1. Receives SIGTERM signal
2. Stops accepting new connections
3. Waits for existing requests to complete
4. Flushes analytics events
5. Closes database connections
6. Exits cleanly

## Setup Instructions

### 1. Install Dependencies

```bash
# For production (PostHog)
npm install posthog-node

# Current setup uses stub implementation
```

### 2. Configure Environment

```env
# .env
POSTHOG_API_KEY=phc_your_api_key
POSTHOG_HOST=https://us.i.posthog.com
```

### 3. Initialize Tracking

The tracking is automatically initialized when the server starts. No additional setup required.

## Dashboard Setup

### PostHog Dashboards

Create these dashboards in PostHog:

1. **Error Overview**
   - Error rate over time
   - Errors by category
   - Errors by severity
   - Top error messages

2. **Performance Metrics**
   - API response times
   - Slow queries
   - tRPC procedure performance
   - Request volume

3. **Authentication**
   - Login success/failure rates
   - Token refresh patterns
   - Unauthorized access attempts

4. **Payment Analytics**
   - Subscription creation rate
   - Payment failure reasons
   - Revenue tracking

## Alerting

### Critical Alerts

- Database connection lost
- Payment processing failures
- High error rate (>5% of requests)
- Memory usage > 90%

### Warning Alerts

- Slow API responses (p95 > 2s)
- Authentication failure spike
- 404 rate increase

## Best Practices

### 1. Error Handling

```typescript
// Always use try-catch in async functions
async function myFunction() {
  try {
    // Your logic
  } catch (error) {
    // Track error with context
    analytics.trackError(error, {
      function: 'myFunction',
      userId: context.userId,
      input: sanitizedInput
    });
    
    // Re-throw or handle
    throw error;
  }
}
```

### 2. Performance Tracking

```typescript
// Track operation duration
const startTime = Date.now();

try {
  const result = await expensiveOperation();
  
  analytics.track('operation_completed', userId, {
    duration: Date.now() - startTime,
    success: true
  });
  
  return result;
} catch (error) {
  analytics.track('operation_failed', userId, {
    duration: Date.now() - startTime,
    error: error.message
  });
  throw error;
}
```

### 3. Context Preservation

Always include relevant context when tracking errors:
- User ID
- Operation being performed
- Input parameters (sanitized)
- Request metadata

## Privacy Considerations

### Data Sanitization

- Passwords are never logged
- Auth tokens are excluded from tracking
- Sensitive headers are filtered
- PII is minimized

### Compliance

- GDPR compliant data handling
- User consent for tracking
- Data retention policies
- Right to deletion

## Troubleshooting

### Events Not Appearing

1. Check PostHog API key configuration
2. Verify network connectivity
3. Check console logs for errors
4. Ensure analytics client is initialized

### High Memory Usage

1. Check event batch size
2. Verify flush interval
3. Look for memory leaks in error objects
4. Monitor event queue size

### Missing Context

1. Ensure middleware order is correct
2. Verify user authentication
3. Check context propagation in async functions

## Future Enhancements

1. **Real-time Alerting**: Slack/Discord integration
2. **Custom Metrics**: Business-specific KPIs
3. **Distributed Tracing**: Correlation IDs across services
4. **Log Aggregation**: Centralized logging with ELK stack
5. **APM Integration**: Application Performance Monitoring
6. **Error Grouping**: Smart error deduplication
7. **Automated Recovery**: Self-healing for common issues

## Resources

- [PostHog Node.js SDK](https://posthog.com/docs/libraries/node)
- [Express Error Handling](https://expressjs.com/en/guide/error-handling.html)
- [tRPC Error Handling](https://trpc.io/docs/error-handling)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)