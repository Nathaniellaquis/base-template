# API Reference

## Overview

INGRD uses [tRPC](https://trpc.io/) for type-safe API communication between the React Native app and Node.js backend. All API calls are made over HTTP/HTTPS with automatic type inference.

## Base Configuration

### Endpoint
```
Development: http://localhost:3001/trpc
Production: https://your-domain.com/trpc
```

### Authentication
All protected endpoints require a Firebase JWT token in the Authorization header:
```
Authorization: Bearer <firebase-jwt-token>
```

### Content Type
All requests use `application/json` content type.

## Endpoint Reference

### User Management

#### Get Current User
```typescript
GET /trpc/user.get
```
Fetches the authenticated user's profile including onboarding status.

**Authentication**: Required  
**Input**: None  
**Response**:
```typescript
{
  _id: string
  uid: string
  email: string
  displayName?: string
  role: 'user' | 'admin'
  onboardingCompleted: boolean
  subscription?: Subscription
  paymentMethod?: PaymentMethod
  notificationPreferences: NotificationPreferences
  createdAt: Date
  updatedAt: Date
  // If onboarding not completed:
  onboarding?: {
    currentStep: number
    totalSteps: number
    startedAt: Date
    version: number
  }
}
```

#### Create User
```typescript
POST /trpc/user.create
```
Creates a new user account. Called automatically after Firebase authentication.

**Authentication**: Public (requires Firebase context)  
**Input**: 
```typescript
{
  // Validated by createUserSchema
  // Fields populated from Firebase auth
}
```
**Response**: `User` object

#### Update User Profile
```typescript
POST /trpc/user.update
```
Updates the current user's profile information.

**Authentication**: Required  
**Input**:
```typescript
{
  displayName?: string  // 1-50 characters
  // Other fields from updateUserSchema
}
```
**Response**: Updated `User` object

### Onboarding

#### Update Onboarding Progress
```typescript
POST /trpc/onboarding.updateOnboarding
```
Manages onboarding flow progression.

**Authentication**: Required  
**Input**:
```typescript
{
  action: 'complete' | 'previous' | 'next'
}
```
**Response**: Updated `User` with onboarding status

### Notifications

#### Register Push Token
```typescript
POST /trpc/notifications.registerToken
```
Registers a device for push notifications.

**Authentication**: Required  
**Input**:
```typescript
{
  token: string        // FCM/APNs token
  deviceId: string     // Unique device identifier
  platform: 'ios' | 'android'
}
```
**Response**:
```typescript
{
  success: boolean
  deviceCount: number  // Total registered devices
}
```

#### Update Notification Preferences
```typescript
POST /trpc/notifications.updatePreferences
```
Updates user's notification preferences.

**Authentication**: Required  
**Input**:
```typescript
{
  enabled: boolean     // Master switch
  updates?: boolean    // App updates
  reminders?: boolean  // Reminders
  social?: boolean     // Social notifications
}
```
**Response**: `{ success: boolean }`

#### Get Notifications
```typescript
GET /trpc/notifications.getNotifications
```
Retrieves user's notifications with pagination.

**Authentication**: Required  
**Input**:
```typescript
{
  limit?: number      // Default: 20
  skip?: number       // Default: 0
  unreadOnly?: boolean // Default: false
}
```
**Response**:
```typescript
{
  notifications: Notification[]
  total: number
}
```

#### Mark Notification as Read
```typescript
POST /trpc/notifications.markAsRead
```
Marks a specific notification as read.

**Authentication**: Required  
**Input**:
```typescript
{
  notificationId: string
}
```
**Response**: `{ success: boolean }`

#### Send Notification (Self)
```typescript
POST /trpc/notifications.sendToUser
```
Sends a notification to another user (if permitted).

**Authentication**: Required  
**Input**:
```typescript
{
  userId: string
  title: string
  body: string
  category: 'updates' | 'reminders' | 'social'
  data?: any
}
```
**Response**:
```typescript
{
  sent: boolean
  notificationId?: string
  reason?: string      // If not sent
}
```

### Payment & Subscriptions

#### Get Subscription Status
```typescript
GET /trpc/payment.getSubscription
```
Retrieves current subscription details with 5-minute caching.

**Authentication**: Required  
**Input**: None  
**Response**:
```typescript
{
  subscription: {
    id?: string
    status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'none'
    plan: 'free' | 'basic' | 'pro' | 'enterprise'
    period: 'monthly' | 'yearly'
    currentPeriodEnd?: Date
    cancelAtPeriodEnd: boolean
    priceId?: string
    productId?: string
    lastSyncedAt?: Date
  }
  plan: 'free' | 'basic' | 'pro' | 'enterprise'
}
```

#### Create/Update Subscription
```typescript
POST /trpc/payment.subscribe
```
Creates new subscription or updates existing one.

**Authentication**: Required  
**Input**:
```typescript
{
  plan: 'basic' | 'pro' | 'enterprise'
  period?: 'monthly' | 'yearly'  // Default: 'monthly'
  paymentMethodId?: string       // For new subscriptions
}
```
**Response**:
```typescript
{
  user: User              // Updated user object
  action: 'created' | 'upgraded' | 'downgraded' | 'resumed'
  subscriptionId?: string
  clientSecret?: string   // For payment confirmation
  customerId?: string
  amount?: number
  plan: string
  period: string
  effectiveDate?: Date | 'immediate'
}
```

#### Cancel Subscription
```typescript
POST /trpc/payment.cancel
```
Cancels subscription at period end.

**Authentication**: Required  
**Input**: None  
**Response**:
```typescript
{
  user: User
  success: boolean
  message: string
  cancelAt: Date
  plan: string
}
```

#### Create Customer Portal Session
```typescript
POST /trpc/payment.createPortalSession
```
Creates customer billing portal for subscription management (Web only).

**Authentication**: Required  
**Input**:
```typescript
{
  returnUrl: string  // Must be valid URL
}
```
**Response**:
```typescript
{
  url: string        // Portal URL to redirect to
  sessionId: string
}
```

#### Get Payment Methods
```typescript
GET /trpc/payment.getPaymentMethods
```
Retrieves saved payment methods.

**Authentication**: Required  
**Input**: None  
**Response**:
```typescript
{
  paymentMethods: Array<{
    id: string
    type: 'card'
    last4: string
    brand: string
    expiryMonth: number
    expiryYear: number
    isDefault: boolean
  }>
}
```

#### Add Payment Method
```typescript
POST /trpc/payment.createSetupIntent
```
Creates setup intent for adding new payment method.

**Authentication**: Required  
**Input**: None  
**Response**:
```typescript
{
  setupIntentClientSecret: string
  customerId: string
}
```

#### Set Default Payment Method
```typescript
POST /trpc/payment.setDefaultPaymentMethod
```
Sets a payment method as default.

**Authentication**: Required  
**Input**:
```typescript
{
  paymentMethodId: string
}
```
**Response**: `{ success: boolean }`

#### Remove Payment Method
```typescript
POST /trpc/payment.removePaymentMethod
```
Removes a saved payment method. Cannot remove the only payment method or the default one.

**Authentication**: Required  
**Input**:
```typescript
{
  paymentMethodId: string
}
```
**Response**: `{ success: boolean }`

### Admin Operations

All admin endpoints require `role: 'admin'` in the user object.

#### Send Test Notification
```typescript
POST /trpc/admin.sendTestNotification
```
Sends test notification to any user.

**Authentication**: Admin required  
**Input**:
```typescript
{
  userId: string
  title: string
  body: string
  category: 'updates' | 'reminders' | 'social'
}
```
**Response**:
```typescript
{
  sent: boolean
  notificationId?: string
  reason?: string
}
```

#### Get All Notifications
```typescript
GET /trpc/admin.getAllNotifications
```
Retrieves all system notifications with user information.

**Authentication**: Admin required  
**Input**:
```typescript
{
  limit?: number  // Default: 50
  skip?: number   // Default: 0
}
```
**Response**:
```typescript
{
  notifications: Array<Notification & {
    userEmail: string
    userName?: string
  }>
  total: number
}
```

#### Get All Users
```typescript
GET /trpc/admin.getAllUsers
```
Retrieves all users with search capability.

**Authentication**: Admin required  
**Input**:
```typescript
{
  limit?: number   // Default: 50
  skip?: number    // Default: 0
  search?: string  // Search email/name
}
```
**Response**:
```typescript
{
  users: User[]
  total: number
}
```

#### Update User Role
```typescript
POST /trpc/admin.promoteToAdmin
```
Changes a user's role.

**Authentication**: Admin required  
**Input**:
```typescript
{
  userId: string
  role: 'user' | 'admin'
}
```
**Response**:
```typescript
{
  success: boolean
  role: string
}
```
**Note**: Cannot demote yourself

#### Get Admin Statistics
```typescript
GET /trpc/admin.getStats
```
Retrieves dashboard statistics.

**Authentication**: Admin required  
**Response**:
```typescript
{
  totalUsers: number
  totalNotifications: number
  notificationsSentToday: number
  activeUsers: number  // Last 7 days
}
```

## Error Handling

All endpoints return standard tRPC errors:

### Error Codes
- `UNAUTHORIZED` - No valid authentication token
- `FORBIDDEN` - Insufficient permissions
- `BAD_REQUEST` - Invalid input or business logic error
- `NOT_FOUND` - Resource not found
- `INTERNAL_SERVER_ERROR` - Server error

### Error Response Format
```typescript
{
  error: {
    message: string
    code: string
    httpStatus: number
  }
}
```

### Common Error Scenarios

| Code | Scenario | Example |
|------|----------|---------|
| `UNAUTHORIZED` | Missing/invalid token | "No authentication token provided" |
| `FORBIDDEN` | Insufficient permissions | "Admin access required" |
| `BAD_REQUEST` | Invalid input | "Display name must be 1-50 characters" |
| `NOT_FOUND` | Resource missing | "User not found" |
| `INTERNAL_SERVER_ERROR` | Server error | "Database connection failed" |

## Rate Limiting

Currently no rate limiting is implemented. This should be added before production deployment.

## Webhooks

### RevenueCat Webhooks
```
POST /webhooks/revenuecat
```
Handles RevenueCat webhook events for subscription updates.

**Authentication**: RevenueCat signature validation (if configured)  
**Events Handled**:
- `INITIAL_PURCHASE`
- `RENEWAL`
- `CANCELLATION`
- `PRODUCT_CHANGE`
- `BILLING_ISSUE`
- `TRIAL_STARTED`
- `TRIAL_CONVERTED`
- `EXPIRATION`

## Client Usage Examples

### TypeScript/JavaScript
```typescript
import { trpc } from '@/lib/api';

// Query
const { data: user } = trpc.user.get.useQuery();

// Mutation
const updateUser = trpc.user.update.useMutation({
  onSuccess: (data) => {
    console.log('User updated:', data);
  },
  onError: (error) => {
    handleError(error, 'Update failed');
  }
});

await updateUser.mutateAsync({
  displayName: 'New Name'
});
```

### Direct HTTP
```bash
# Get user
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.example.com/trpc/user.get

# Update user
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"json":{"displayName":"New Name"}}' \
  https://api.example.com/trpc/user.update
```

## Middleware Features

- **Request Logging**: All requests logged with timing
- **Performance Monitoring**: Slow requests (>3s) logged as warnings
- **Error Tracking**: Errors tracked via analytics
- **Auth Failure Tracking**: Unauthorized attempts tracked for security

## Best Practices

1. **Always handle errors** - Network requests can fail
2. **Use optimistic updates** - Update UI before server confirms
3. **Cache appropriately** - Use tRPC's built-in caching
4. **Validate inputs** - Client validation improves UX
5. **Handle loading states** - Show appropriate UI during requests
6. **Refresh tokens** - Firebase tokens expire after 1 hour

## Security Considerations

1. **Authentication** - Always verify Firebase tokens
2. **Authorization** - Check user permissions for each operation
3. **Input validation** - All inputs validated with Zod schemas
4. **Rate limiting** - Implement before production
5. **CORS** - Configure for your domains only
6. **Webhook validation** - Verify RevenueCat signatures

## Testing

Use these test values:
- **ObjectId**: `507f1f77bcf86cd799439011` (24-char hex)
- **Firebase UID**: Any string
- **RevenueCat Test**: Use sandbox accounts in App Store/Play Store