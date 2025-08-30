# Testing Guide

## Overview

This guide covers testing strategies, setup, and best practices for the INGRD application. While the project doesn't currently have automated tests, this guide provides the foundation for implementing a comprehensive testing strategy.

## Testing Stack Recommendations

### Frontend Testing
- **Jest** - Test runner and assertion library
- **React Native Testing Library** - Component testing
- **Detox** - E2E testing for React Native

### Backend Testing
- **Jest** - Test runner for Node.js
- **Supertest** - HTTP assertion library
- **MongoDB Memory Server** - In-memory MongoDB for tests

## Quick Setup

### 1. Install Testing Dependencies

```bash
# Frontend testing
cd app
npm install --save-dev @testing-library/react-native jest @types/jest
npm install --save-dev @testing-library/jest-native
npm install --save-dev jest-expo

# Backend testing
cd ../server
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev supertest @types/supertest
npm install --save-dev mongodb-memory-server
```

### 2. Configure Jest

#### Frontend (`app/jest.config.js`)
```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@shared/(.*)$': '<rootDir>/../types/$1'
  }
};
```

#### Backend (`server/jest.config.js`)
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@shared/(.*)$': '<rootDir>/../types/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts']
};
```

### 3. Add Test Scripts

Update `package.json` files:

```json
// app/package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}

// server/package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  }
}
```

## Testing Patterns

### 1. Component Testing (Frontend)

#### Basic Component Test
```typescript
// app/components/ui/Button/__tests__/Button.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={() => {}} />
    );
    
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Test Button" onPress={onPress} />
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    const { getByTestId } = render(
      <Button title="Test" onPress={() => {}} loading />
    );
    
    expect(getByTestId('button-loading')).toBeTruthy();
  });
});
```

#### Hook Testing
```typescript
// app/hooks/__tests__/usePayment.test.tsx
import { renderHook, act } from '@testing-library/react-hooks';
import { usePayment } from '../usePayment';
import { PaymentProvider } from '@/providers/payment';

const wrapper = ({ children }) => (
  <PaymentProvider>{children}</PaymentProvider>
);

describe('usePayment', () => {
  it('returns current plan', () => {
    const { result } = renderHook(() => usePayment(), { wrapper });
    
    expect(result.current.plan).toBe('free');
  });

  it('requires plan and shows modal', () => {
    const { result } = renderHook(() => usePayment(), { wrapper });
    
    act(() => {
      const hasAccess = result.current.requirePlan('pro');
      expect(hasAccess).toBe(false);
    });
  });
});
```

### 2. API Testing (Backend)

#### TRPC Router Test
```typescript
// server/routers/__tests__/user.test.ts
import { createTestContext } from '../../test/context';
import { appRouter } from '../../trpc/app';

describe('User Router', () => {
  it('creates a new user', async () => {
    const ctx = await createTestContext({
      firebaseUid: 'test-uid',
      email: 'test@example.com'
    });

    const user = await appRouter.createCaller(ctx).user.create({});

    expect(user).toMatchObject({
      uid: 'test-uid',
      email: 'test@example.com',
      role: 'user'
    });
  });

  it('updates user profile', async () => {
    const ctx = await createTestContext({
      user: { displayName: 'Old Name' }
    });

    const updated = await appRouter
      .createCaller(ctx)
      .user.update({ displayName: 'New Name' });

    expect(updated.displayName).toBe('New Name');
  });

  it('requires authentication', async () => {
    const ctx = await createTestContext({ authenticated: false });

    await expect(
      appRouter.createCaller(ctx).user.get()
    ).rejects.toThrow('UNAUTHORIZED');
  });
});
```

#### Service Test
```typescript
// server/services/revenuecat/__tests__/subscription.test.ts
import { syncUserWithRevenueCat } from '../user-sync';
import { getCustomer } from '../operations/customer';

jest.mock('../operations/customer');

describe('Subscription Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('syncs subscription with RevenueCat', async () => {
    const mockCustomerInfo = {
      subscriber: {
        entitlements: { pro: { expires_date: null } },
        subscriptions: { 'prod_123': { store: 'APP_STORE' } }
      }
    };

    getCustomer.mockResolvedValue(mockCustomerInfo);

    const result = await syncUserWithRevenueCat('user_123');

    expect(result).toEqual({
      subscription: {
        plan: 'pro',
        status: 'active',
        isActive: true
      }
    });

    expect(getCustomer).toHaveBeenCalledWith('user_123');
  });
});
```

### 3. Integration Testing

#### Database Integration Test
```typescript
// server/test/integration/user-flow.test.ts
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB } from '../../db';
import { createUser } from '../../services/user/create-user';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  await connectDB();
});

afterAll(async () => {
  await mongoServer.stop();
});

describe('User Flow', () => {
  it('complete user registration flow', async () => {
    // Create user
    const user = await createUser({
      uid: 'test-123',
      email: 'test@example.com'
    });

    expect(user.uid).toBe('test-123');
    expect(user.revenueCatId).toBeDefined();

    // Verify MongoDB document
    const dbUser = await getUserCollection().findOne({ uid: 'test-123' });
    expect(dbUser).toBeTruthy();
  });
});
```

### 4. E2E Testing (Mobile)

#### Detox Test Example
```javascript
// e2e/auth.test.js
describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should create account and login', async () => {
    // Navigate to signup
    await element(by.id('get-started-button')).tap();
    await element(by.id('signup-link')).tap();

    // Fill form
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('Test123!');
    await element(by.id('signup-button')).tap();

    // Verify logged in
    await expect(element(by.id('dashboard-screen'))).toBeVisible();
  });

  it('should handle payment flow', async () => {
    // Navigate to settings
    await element(by.id('settings-tab')).tap();
    await element(by.id('subscription-section')).tap();

    // Upgrade to pro
    await element(by.id('upgrade-button')).tap();
    await element(by.id('pro-plan')).tap();

    // Enter card details
    await element(by.id('card-number')).typeText('4242424242424242');
    await element(by.id('card-expiry')).typeText('12/25');
    await element(by.id('card-cvc')).typeText('123');
    await element(by.id('subscribe-button')).tap();

    // Verify success
    await expect(element(by.text('Pro Plan'))).toBeVisible();
  });
});
```

## Test Data & Mocks

### Mock Firebase Auth
```typescript
// test/mocks/firebase.ts
export const mockFirebaseAuth = {
  currentUser: {
    uid: 'test-user-123',
    email: 'test@example.com',
    getIdToken: jest.fn().mockResolvedValue('mock-token')
  },
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn()
};

jest.mock('firebase/auth', () => ({
  getAuth: () => mockFirebaseAuth,
  initializeAuth: () => mockFirebaseAuth
}));
```

### Mock RevenueCat
```typescript
// test/mocks/revenuecat.ts
export const mockRevenueCat = {
  getCustomer: jest.fn().mockResolvedValue({
    subscriber: {
      entitlements: { pro: { expires_date: null } }
    }
  }),
  revokeSubscription: jest.fn(),
  grantEntitlement: jest.fn()
};

export const mockPurchases = {
  configure: jest.fn(),
  getCustomerInfo: jest.fn(),
  purchasePackage: jest.fn(),
  restorePurchases: jest.fn()
};

jest.mock('@/services/revenuecat', () => mockRevenueCat);
jest.mock('react-native-purchases', () => mockPurchases);
```

### Test Utilities
```typescript
// test/utils/test-data.ts
import { ObjectId } from 'mongodb';

export const createTestUser = (overrides = {}) => ({
  _id: new ObjectId().toString(),
  uid: 'test-uid',
  email: 'test@example.com',
  role: 'user',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createTestSubscription = (overrides = {}) => ({
  id: 'sub_test',
  status: 'active',
  plan: 'pro',
  period: 'monthly',
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  cancelAtPeriodEnd: false,
  ...overrides
});
```

## Testing Best Practices

### 1. Test Structure
```typescript
describe('Feature/Component Name', () => {
  // Setup
  beforeEach(() => {
    // Reset mocks, clear data
  });

  describe('Scenario', () => {
    it('should do expected behavior', () => {
      // Arrange
      const input = prepareTestData();
      
      // Act
      const result = performAction(input);
      
      // Assert
      expect(result).toMatchExpectation();
    });
  });
});
```

### 2. What to Test

#### Components
- ✅ Rendering with different props
- ✅ User interactions (clicks, input)
- ✅ Conditional rendering
- ✅ Error states
- ✅ Loading states

#### API Endpoints
- ✅ Success cases
- ✅ Input validation
- ✅ Authentication/authorization
- ✅ Error handling
- ✅ Edge cases

#### Business Logic
- ✅ Calculations
- ✅ Data transformations
- ✅ State management
- ✅ Side effects

### 3. Testing Pyramid

```
         /\
        /E2E\       (5%) - Critical user flows
       /------\
      /  Integ  \    (20%) - API & DB integration
     /------------\
    /     Unit     \  (75%) - Components, functions, services
   /----------------\
```

### 4. Common Testing Scenarios

#### Testing Authenticated Endpoints
```typescript
it('requires authentication', async () => {
  const response = await request(app)
    .post('/trpc/user.update')
    .send({ displayName: 'Test' });
    
  expect(response.status).toBe(401);
});

it('works with valid token', async () => {
  const token = await getTestToken();
  const response = await request(app)
    .post('/trpc/user.update')
    .set('Authorization', `Bearer ${token}`)
    .send({ displayName: 'Test' });
    
  expect(response.status).toBe(200);
});
```

#### Testing RevenueCat Webhooks
```typescript
it('handles initial purchase webhook', async () => {
  const payload = revenueCatWebhookFixture('INITIAL_PURCHASE');
  const signature = generateRevenueCatSignature(
    payload,
    process.env.REVENUECAT_WEBHOOK_SECRET
  );

  const response = await request(app)
    .post('/webhooks/revenuecat')
    .set('X-RevenueCat-Signature', signature)
    .send(payload);

  expect(response.status).toBe(200);

  // Verify user subscription updated
  const user = await getUserByRevenueCatId('rc_user_test');
  expect(user.subscription.status).toBe('active');
});
```

## Running Tests

### Development
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- Button.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should create user"
```

### CI/CD Pipeline
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run backend tests
        run: |
          cd server
          npm test -- --coverage
          
      - name: Run frontend tests
        run: |
          cd app
          npm test -- --coverage
          
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Debugging Tests

### VS Code Debug Configuration
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": [
    "--runInBand",
    "--no-cache",
    "--watchAll=false"
  ],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Common Issues

#### "Cannot find module" errors
- Check jest config `moduleNameMapper`
- Verify tsconfig paths align
- Clear jest cache: `jest --clearCache`

#### Async test timeouts
```typescript
// Increase timeout for slow operations
it('handles large data', async () => {
  await processLargeDataset();
}, 10000); // 10 second timeout
```

#### Mock not working
```typescript
// Ensure mock is before import
jest.mock('@/services/user');
import { createUser } from '@/services/user';
```

## Test Coverage Goals

Aim for these coverage targets:

| Type | Target | Priority |
|------|--------|----------|
| Statements | 80% | High |
| Branches | 75% | High |
| Functions | 80% | High |
| Lines | 80% | High |

Focus coverage on:
1. Business logic
2. Data transformations
3. Error handling
4. User interactions

Skip coverage for:
- Simple getters/setters
- Third-party integrations
- UI styling
- Constants

## Next Steps

1. **Set up basic test infrastructure** - Install dependencies and configure
2. **Start with critical paths** - Auth, payments, core features
3. **Add tests with new features** - TDD approach
4. **Integrate with CI/CD** - Run tests on every PR
5. **Monitor coverage** - Track improvements over time

Remember: Tests are an investment in code quality and confidence. Start small and build up your test suite over time.