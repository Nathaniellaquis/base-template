# Authentication System

## Overview
A comprehensive authentication system using Firebase Auth for authentication and MongoDB for user data persistence. The system provides seamless synchronization between Firebase and MongoDB, with automatic error recovery and type-safe API communication through tRPC.

## Architecture

### 1. Technology Stack

- **Authentication Provider**: Firebase Auth
- **User Data Storage**: MongoDB
- **API Layer**: tRPC with type-safe procedures
- **Client SDK**: Firebase Auth SDK for React Native
- **Server SDK**: Firebase Admin SDK for Node.js
- **State Management**: React Context API

### 2. Database Schema

#### Firebase User (Authentication)
```typescript
// Managed by Firebase Auth
interface FirebaseUser {
  uid: string;                // Unique user ID
  email: string;              // User email
  emailVerified: boolean;     // Email verification status
  displayName?: string;       // Optional display name
  photoURL?: string;          // Optional profile photo
  customClaims: {
    mongoId?: string;         // MongoDB document ID
    role?: 'user' | 'admin';  // User role
  };
}
```

#### MongoDB User Document
```typescript
// types/user.ts
interface User {
  _id: ObjectId;              // MongoDB document ID
  uid: string;                // Firebase UID (unique index)
  email: string;              // User email
  displayName?: string;       // Display name
  emailVerified: boolean;     // Email verification status
  role: 'user' | 'admin';     // User role (default: 'user')
  onboardingCompleted: boolean; // Onboarding status
  
  // Notification settings
  notificationPreferences: {
    push: boolean;
    email: boolean;
    inApp: boolean;
  };
  pushTokens: string[];       // FCM push tokens
  
  // Subscription data
  subscription?: {
    stripeCustomerId?: string;
    stripePriceId?: string;
    stripeProductId?: string;
    trialEndsAt?: Date;
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. Authentication Flow

#### Sign Up Process
```mermaid
1. User submits email, password, displayName
2. Firebase creates user account
3. Update Firebase profile with displayName
4. Create MongoDB user document
5. Set custom claims (mongoId, role)
6. Return authenticated user
```

#### Sign In Process
```mermaid
1. User submits email and password
2. Firebase authenticates user
3. Fetch MongoDB user data
4. If MongoDB user missing, create it
5. Merge Firebase and MongoDB data
6. Return authenticated user
```

### 4. UI Components

#### AuthFormLayout Component
All authentication screens (login, signup, forgot password) use a shared layout component for consistency:

```typescript
// app/components/features/auth/AuthFormLayout/index.tsx
<AuthFormLayout
  title="Welcome Back"
  subtitle="Sign in to continue"
  bottomLinks={[
    {
      text: "Don't have an account?",
      linkText: "Sign Up", 
      href: "/signup",
    },
  ]}
>
  {/* Form content */}
</AuthFormLayout>
```

Features:
- Consistent keyboard handling
- Safe area support
- Back button navigation
- Themed styling
- Responsive layout
- Bottom link navigation

### 5. Provider Implementation

#### `app/providers/auth-provider.tsx`
```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  error: string | null;
  
  // Authentication methods
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  
  // Utility methods
  refreshUser: () => Promise<void>;
  clearError: () => void;
}
```

Key features:
- **Firebase Auth persistence with AsyncStorage (mobile) and localStorage (web)**
- Firebase Auth state listener (`onAuthStateChanged`)
- Automatic user data synchronization
- Token management for API requests
- App state change listener for data refresh
- **Cross-platform compatibility for persistence**
- Error handling with user-friendly messages

### 5. TRPC Router Structure

#### Authentication Context (`server/trpc/context.ts`)
```typescript
export async function createContext({ req }: CreateContextOptions) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return { user: null, userId: null, isAdmin: false };
  }
  
  try {
    // Verify Firebase token
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Fetch MongoDB user
    let user = await findUserByUid(userId);
    
    // Auto-recovery: Create MongoDB user if missing
    if (!user && decodedToken.email) {
      user = await createUserFromFirebase(decodedToken);
    }
    
    return {
      user,
      userId,
      isAdmin: user?.role === 'admin',
    };
  } catch (error) {
    return { user: null, userId: null, isAdmin: false };
  }
}
```

#### User Router (`server/routers/user/index.ts`)
```typescript
export const userRouter = router({
  // Get current user (protected)
  get: protectedProcedure
    .query(async ({ ctx }) => {
      return await getUserByUid(ctx.userId);
    }),
  
  // Create new user (public - for sign up)
  create: publicProcedure
    .input(createUserSchema)
    .mutation(async ({ input }) => {
      return await createUser(input);
    }),
  
  // Update user (protected)
  update: protectedProcedure
    .input(updateUserSchema)
    .mutation(async ({ ctx, input }) => {
      return await updateUser(ctx.userId, input);
    }),
  
  // Delete user (protected)
  delete: protectedProcedure
    .mutation(async ({ ctx }) => {
      return await deleteUser(ctx.userId);
    }),
});
```

### 6. Hook Patterns

#### `app/hooks/useAuth.ts`
```typescript
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

#### `app/hooks/useProtectedRoute.ts`
```typescript
export function useProtectedRoute() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    if (!loading) {
      const isAuthRoute = pathname.includes('/(auth)');
      
      if (!user && !isAuthRoute) {
        // Redirect to login if not authenticated
        router.replace('/(auth)/login');
      } else if (user && isAuthRoute) {
        // Redirect to app if authenticated
        router.replace('/(tabs)');
      }
    }
  }, [user, loading, pathname]);
  
  return { user, loading };
}
```

### 7. Route Structure

```
app/
  (auth)/                    # Public auth routes
    _layout.tsx             # Auth layout wrapper
    login/                  # Sign in screen
      index.tsx
    signup/                 # Sign up screen
      index.tsx
    forgot-password/        # Password reset screen
      index.tsx
  
  (tabs)/                   # Protected app routes
    _layout.tsx            # Main app layout
    home/
    profile/
    settings/
  
  (onboarding)/            # Protected onboarding routes
    _layout.tsx
    welcome/
    profile-setup/
```

### 8. Authentication Screens

#### Sign In Screen (`app/(auth)/login/index.tsx`)
```typescript
export default function LoginScreen() {
  const { signIn, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSignIn = async () => {
    try {
      await signIn(email, password);
      // Navigation handled automatically by auth state
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };
  
  return (
    <View>
      <Input
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <Input
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Sign In" onPress={handleSignIn} />
      <Button 
        title="Forgot Password?" 
        onPress={() => router.push('/forgot-password')}
      />
    </View>
  );
}
```

### 9. Protected Route Implementation

#### Root Layout (`app/_layout.tsx`)
```typescript
export default function RootLayout() {
  const { user, loading } = useAuth();
  const { onboardingCompleted } = useOnboarding();
  
  if (loading) {
    return <SplashScreen />;
  }
  
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!user ? (
        // Auth routes for unauthenticated users
        <Stack.Screen name="(auth)" />
      ) : !onboardingCompleted ? (
        // Onboarding for new users
        <Stack.Screen name="(onboarding)" />
      ) : (
        // Main app for authenticated users
        <Stack.Screen name="(tabs)" />
      )}
    </Stack>
  );
}
```

### 10. Token Management

#### Client-Side Token Handling
```typescript
// In AuthProvider
const getAuthToken = async () => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    return await currentUser.getIdToken();
  }
  return null;
};

// In tRPC client setup
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${API_URL}/trpc`,
      headers: async () => ({
        Authorization: token ? `Bearer ${token}` : '',
      }),
    }),
  ],
});
```

### 11. Security Features

1. **Token Verification**: Every API request validates Firebase ID token
2. **Custom Claims**: MongoDB ID stored in Firebase token for faster lookups
3. **Role-Based Access Control**: Separate procedures for admin operations
4. **Auto-Recovery**: Creates MongoDB user if missing to prevent auth failures
5. **Secure Password Reset**: Firebase handles password reset emails
6. **Email Verification**: Track and enforce email verification status

### 12. Error Handling

```typescript
// In AuthProvider
const handleAuthError = (error: any) => {
  const errorMessage = error.code ? 
    AUTH_ERROR_MESSAGES[error.code] || 'An unexpected error occurred' :
    error.message;
  
  setError(errorMessage);
  return errorMessage;
};

const AUTH_ERROR_MESSAGES = {
  'auth/user-not-found': 'No account found with this email',
  'auth/wrong-password': 'Incorrect password',
  'auth/email-already-in-use': 'Email is already registered',
  'auth/weak-password': 'Password should be at least 6 characters',
  'auth/invalid-email': 'Invalid email address',
};
```

### 13. User Data Synchronization

```typescript
// server/services/user/sync-user.ts
export async function syncUserWithFirebase(firebaseUser: DecodedIdToken) {
  let mongoUser = await UserModel.findOne({ uid: firebaseUser.uid });
  
  if (!mongoUser) {
    // Create MongoDB user from Firebase data
    mongoUser = await UserModel.create({
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      emailVerified: firebaseUser.email_verified || false,
      displayName: firebaseUser.name,
      role: 'user',
      onboardingCompleted: false,
      notificationPreferences: {
        push: true,
        email: true,
        inApp: true,
      },
    });
    
    // Set custom claims
    await adminAuth.setCustomUserClaims(firebaseUser.uid, {
      mongoId: mongoUser._id.toString(),
      role: 'user',
    });
  }
  
  return mongoUser;
}
```

### 14. Benefits of This Architecture

- **Separation of Concerns**: Firebase handles auth, MongoDB stores app data
- **Type Safety**: tRPC ensures type-safe API communication
- **Scalability**: Easy to add OAuth providers through Firebase
- **Reliability**: Auto-recovery prevents auth failures
- **Security**: Industry-standard authentication with Firebase
- **Flexibility**: Custom user data in MongoDB without Firebase limitations
- **Cross-Platform Persistence**: Seamless auth state persistence across iOS, Android, and Web
- **Platform-Optimized Storage**: AsyncStorage for mobile, localStorage for web
- **User Experience**: No repeated logins, fast app startup for returning users

### 15. Future Enhancements

1. **OAuth Integration**: Add Google, Apple, Facebook sign-in
2. **Multi-Factor Authentication**: Enable 2FA through Firebase
3. **Session Management**: Implement refresh token rotation
4. **Account Linking**: Allow users to link multiple auth providers
5. **Biometric Authentication**: Add Face ID/Touch ID support
6. **Magic Link Authentication**: Passwordless email sign-in

### 16. Firebase Auth Persistence Configuration

#### Platform-Specific Persistence

The authentication system uses different persistence mechanisms depending on the platform:

##### Mobile Platforms (iOS/Android)
```typescript
// app/providers/auth-provider.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Configure Auth with AsyncStorage persistence for mobile
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
```

**Benefits of AsyncStorage persistence:**
- User stays logged in between app sessions
- Survives app restarts and device reboots
- Encrypted storage on device
- Automatic token refresh handling

##### Web Platform
```typescript
// For web builds, Firebase automatically uses localStorage
import { getAuth } from 'firebase/auth';

// Web auth automatically uses localStorage persistence
const auth = getAuth(app);
```

**Web persistence features:**
- Uses browser's localStorage API
- Survives browser tab refreshes
- Respects browser privacy settings
- Automatic cleanup on logout

#### Cross-Platform Compatibility Implementation

```typescript
// app/providers/auth-provider.tsx
import { Platform } from 'react-native';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth, 
  getReactNativePersistence 
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const app = initializeApp(firebaseConfig);

// Platform-specific auth initialization
const auth = Platform.OS === 'web' 
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });

export { auth };
```

#### Persistence Benefits

1. **Seamless User Experience**
   - Users don't need to log in every time they open the app
   - Authentication state persists across app restarts
   - Automatic token refresh prevents expired sessions

2. **Security**
   - Tokens are stored securely using platform best practices
   - AsyncStorage on mobile provides encrypted storage
   - localStorage on web respects same-origin policy

3. **Performance**
   - Reduces authentication API calls
   - Faster app startup for returning users
   - Cached user data improves perceived performance

#### Persistence Troubleshooting

```typescript
// Common persistence issues and solutions

// Issue: AsyncStorage not installed
// Solution: Install the package
// npm install @react-native-async-storage/async-storage

// Issue: iOS build fails after adding AsyncStorage
// Solution: Install pods
// cd ios && pod install

// Issue: Persistence warnings on startup
// These warnings are normal and indicate proper setup:
// "@firebase/auth: Auth (10.x.x): You are initializing Firebase Auth for React Native..."

// Issue: User not persisting on web
// Check that Firebase config includes authDomain:
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com", // Required for web
  projectId: "your-project-id",
  // ... other config
};
```

#### Testing Persistence

```typescript
// Test persistence behavior
export function testAuthPersistence() {
  const testPersistence = async () => {
    // Sign in user
    await signInWithEmailAndPassword(auth, 'test@example.com', 'password');
    
    // Simulate app restart (web: refresh page, mobile: restart app)
    // User should still be authenticated
    
    auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('✅ Persistence working: User persisted across sessions');
      } else {
        console.log('❌ Persistence issue: User not persisted');
      }
    });
  };
  
  return testPersistence;
}
```

### 17. Implementation Checklist

- [x] Firebase project setup and configuration
- [x] MongoDB user schema and models
- [x] AuthProvider with Firebase integration
- [x] **Firebase Auth persistence with AsyncStorage (mobile) and localStorage (web)**
- [x] **Cross-platform persistence compatibility**
- [x] tRPC context with token verification
- [x] User router with CRUD operations
- [x] Protected and public procedures
- [x] Authentication screens (login, signup, forgot password)
- [x] Protected route implementation
- [x] Token management and API integration
- [x] Error handling and user feedback
- [x] User data synchronization
- [x] Custom claims for role management
- [x] Auto-recovery for missing MongoDB users
- [x] App state change listener for data refresh