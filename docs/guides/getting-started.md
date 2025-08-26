# Getting Started Guide

## 🚀 Quick Start

Get the INGRD app running in under 10 minutes.

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **MongoDB** 6+ ([Download](https://www.mongodb.com/try/download/community) or use [Atlas](https://www.mongodb.com/cloud/atlas))
- **Git** ([Download](https://git-scm.com/))
- **iOS Development** (Mac only): Xcode 14+ from App Store
- **Android Development**: Android Studio ([Download](https://developer.android.com/studio))

### Step 1: Clone Repository
```bash
git clone https://github.com/[your-org]/ingrd.git
cd ingrd
```

### Step 2: Install Dependencies
```bash
# Install all dependencies (app + server)
npm install

# iOS only: Install pods
cd app/ios && pod install && cd ../..
```

### Step 3: Configure Environment

```bash
# Copy environment template (single .env file in root)
cp .env.example .env

# Edit .env with your values
# Backend runs on port 3000 by default
```

#### Key Environment Variables:
```bash
# Backend
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/your-db-name
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CREDENTIALS='{"type":"service_account",...}'

# Frontend
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_FIREBASE_API_KEY=your-key-here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-domain.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Note**: Ensure your MongoDB URI points to the correct database name.

### Step 4: Setup Firebase

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Get service account credentials:
   - Go to Project Settings → Service Accounts
   - Generate new private key
   - Copy the entire JSON content
   - Paste as a single line in your `.env` file as `FIREBASE_ADMIN_CREDENTIALS`
4. Copy web app config values to your `.env` file

### Step 5: Start MongoDB
```bash
# If installed locally
mongod

# Or use Docker
docker run -d -p 27017:27017 --name ingrd-mongo mongo:6
```

### Step 6: Run the Application
```bash
# Start both frontend and backend
npm run dev

# Or run separately:
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend (choose platform)
npm run dev:ios      # iOS Simulator
npm run dev:android  # Android Emulator
npm run dev:web      # Web Browser
```

### Step 7: Verify Installation
1. Backend should be running at `http://localhost:3000`
2. App should open in simulator/emulator
3. Try creating an account to test authentication

## 📱 Platform-Specific Setup

### iOS Setup (Mac Only)

#### Requirements
- macOS 12+ (Monterey or later)
- Xcode 14+ from App Store
- CocoaPods: `sudo gem install cocoapods`
- iOS Simulator (comes with Xcode)

#### Setup Steps
```bash
# Install Xcode command line tools
xcode-select --install

# Accept Xcode license
sudo xcodebuild -license accept

# Install pods
cd app/ios
pod install
cd ../..

# Run on iOS
npm run dev:ios
```

#### Common iOS Issues
- **"No bundle URL present"**: Clear Metro cache: `npx expo start -c`
- **Pod install fails**: Update pods: `cd ios && pod repo update && pod install`
- **Simulator not found**: Open Xcode → Settings → Platforms → Download iOS Simulator

### Android Setup

#### Requirements
- Android Studio ([Download](https://developer.android.com/studio))
- Android SDK 31+
- Android Emulator or physical device
- Java 11+

#### Setup Steps
1. Install Android Studio
2. Open Android Studio → Settings → SDK Manager
3. Install:
   - Android SDK Platform 31+
   - Android SDK Build-Tools
   - Android Emulator
   - Intel x86 Emulator Accelerator (HAXM)

#### Environment Variables
```bash
# Add to ~/.bashrc or ~/.zshrc
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
export ANDROID_HOME=$HOME/Android/Sdk           # Linux
export ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk  # Windows

export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

#### Run on Android
```bash
# Start emulator (or connect device)
npm run dev:android
```

#### Common Android Issues
- **"SDK location not found"**: Create `app/android/local.properties`:
  ```
  sdk.dir=/Users/[username]/Library/Android/sdk  # macOS
  sdk.dir=C:\\Users\\[username]\\AppData\\Local\\Android\\Sdk  # Windows
  ```
- **Build fails**: Clean and rebuild:
  ```bash
  cd android
  ./gradlew clean
  cd ..
  npm run dev:android
  ```

## 🔧 Development Tools

### Recommended VS Code Extensions
- **ESLint** - Linting
- **Prettier** - Code formatting
- **TypeScript** - TypeScript support
- **React Native Tools** - RN debugging
- **MongoDB for VS Code** - Database browsing
- **Thunder Client** - API testing

### VS Code Settings
Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.expo": true
  }
}
```

### Debugging

#### React Native Debugger
1. Install React Native Debugger: [Download](https://github.com/jhen0409/react-native-debugger)
2. Start the debugger
3. In app, shake device (or Cmd+D on iOS, Cmd+M on Android)
4. Select "Debug with Chrome"

#### VS Code Debugging
Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}/server",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "console": "integratedTerminal"
    },
    {
      "name": "Attach to Packager",
      "type": "reactnative",
      "request": "attach",
      "port": 8081
    }
  ]
}
```

## 🗄️ Database Setup

### Local MongoDB
```bash
# Create database
mongosh
> use ingrd
> db.createCollection('users')
> db.createCollection('notifications')

# Create indexes
> db.users.createIndex({ uid: 1 }, { unique: true })
> db.users.createIndex({ email: 1 }, { unique: true })
```

### MongoDB Atlas (Cloud)
1. Create free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Set up database user
3. Whitelist IP addresses
4. Get connection string
5. Update `server/.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ingrd
   ```

## 🔐 Firebase Setup Details

### Step 1: Create Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create Project"
3. Name it (e.g., "ingrd-dev")
4. Disable Google Analytics (optional)

### Step 2: Enable Authentication
1. Navigate to Authentication → Sign-in method
2. Enable Email/Password
3. Add test users if needed

### Step 3: Get Configurations

#### Admin SDK (Backend)
1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Copy the JSON content
4. In your `.env` file, add as a single line:
   ```
   FIREBASE_ADMIN_CREDENTIALS='{"type":"service_account","project_id":"..."}'
   ```
5. **IMPORTANT**: Never commit the `.env` file

#### Web SDK (Frontend)
1. Go to Project Settings → General
2. Scroll to "Your apps" → Web app
3. Click "Add app" if no web app exists
4. Copy configuration to `app/.env`:
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=project-id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=project.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

## 🧪 Verify Setup

### Backend Health Check
```bash
# Check if backend is running
curl http://localhost:3000/health

# Response should be:
# { "status": "ok", "timestamp": "..." }
```

### Database Connection
```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/ingrd

# List collections
> show collections
# Should show: users, notifications, etc.
```

### Frontend Connection
1. Open app in simulator
2. Try to create an account
3. Check MongoDB for new user:
   ```bash
   mongosh
   > use ingrd
   > db.users.find().pretty()
   ```

### Firebase Auth Persistence

#### AsyncStorage Configuration (Mobile)
Firebase Auth is configured to persist authentication state using AsyncStorage on mobile platforms:

```typescript
// app/providers/auth-provider.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
```

#### Web Compatibility
For web builds, Firebase Auth automatically uses localStorage for persistence. The system gracefully handles platform differences:

```typescript
// Handles both mobile and web persistence automatically
import { getAuth } from 'firebase/auth';
const auth = Platform.OS === 'web' ? getAuth() : initializeAuth(app, { persistence });
```

### Metro Configuration for @shared Imports

The Metro bundler is configured to support `@shared` path aliases that work across all platforms:

#### `app/metro.config.js`
```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add shared path alias
config.resolver.alias = {
  '@shared': '../',
  '@': './app',
};

// Ensure shared files are watched
config.watchFolders = [
  path.resolve(__dirname, '../'),
];

module.exports = config;
```

This allows you to import shared types and utilities:
```typescript
import { User } from '@shared/types/user';
import { OnboardingStep } from '@shared/types/onboarding';
```

### Style File Naming Convention

All component style files should be named `index.styles.ts` to prevent them from being treated as routes by Expo Router:

```
components/
  ui/
    Button/
      index.tsx          # Component file
      index.styles.ts    # Styles (not Button.styles.ts)
    Card/
      index.tsx
      index.styles.ts
```

**Why `index.styles.ts`?**
- Prevents Expo Router from treating style files as route components
- Maintains consistent naming across all components
- Avoids build errors related to route resolution

## 🚨 Troubleshooting

### Common Issues

#### "Cannot connect to MongoDB"
```bash
# Check if MongoDB is running
ps aux | grep mongod

# Start MongoDB
mongod

# Or with Docker
docker start ingrd-mongo
```

#### "Firebase Admin SDK not found"
```bash
# Check if FIREBASE_ADMIN_CREDENTIALS is set in .env
cat .env | grep FIREBASE_ADMIN_CREDENTIALS

# Ensure it's a valid JSON string on a single line
# Should start with: FIREBASE_ADMIN_CREDENTIALS='{"type":"service_account"...
```

#### "Metro bundler stuck"
```bash
# Clear cache
npx expo start -c

# Reset Metro
watchman watch-del-all
rm -rf node_modules
npm install
```

#### "Type errors on build"
```bash
# Check TypeScript
npm run typecheck

# Fix path aliases
npm run build:clean
```

### New Troubleshooting Scenarios

#### "Loading Issues with Wrong Redirect Paths"
```bash
# Check that route paths match your folder structure
# Common issue: using '/login' instead of '/(auth)/login'

# In navigation calls:
router.push('/(auth)/login');  # Correct
router.push('/login');         # Incorrect - will cause loading issues
```

#### "Signup creates Firebase user but no backend calls"
```bash
# This happens when apiConfig is not imported in auth provider
# Check app/providers/auth/index.tsx has:
import { auth, apiConfig } from '@/config';

# The auth provider needs both for:
# - auth: Firebase authentication
# - apiConfig: TRPC client configuration
```

#### "Failed to fetch user profile after retries"
```bash
# This is normal during signup - backend auto-creates user on first API call
# The auth provider has retry logic (3 attempts with 1s delay)
# If all retries fail, check:
# 1. Backend server is running on port 3000
# 2. EXPO_PUBLIC_API_URL is correct in .env
# 3. No firewall blocking localhost:3000
```

#### "Firebase Persistence Warnings"
If you see warnings about Firebase persistence on startup:

```typescript
// These warnings are normal and can be ignored:
// "@firebase/auth: Auth (10.x.x): You are initializing Firebase Auth for React Native..."

// The warning indicates proper platform-specific persistence setup
```

#### "Style Files Being Treated as Routes"
```bash
# If you see errors like "Cannot resolve component for route /Button.styles"
# Rename your style files to index.styles.ts:

mv components/ui/Button/Button.styles.ts components/ui/Button/index.styles.ts
```

#### "Module Resolution Issues with @shared"
```bash
# If @shared imports fail, check Metro config:
cat app/metro.config.js

# Ensure alias is configured:
# '@shared': '../',

# Clear Metro cache:
npx expo start -c

# Restart development server completely
npm run dev
```

#### "AsyncStorage Persistence Errors on Mobile"
```bash
# Install AsyncStorage if missing:
cd app
npm install @react-native-async-storage/async-storage

# For iOS, install pods:
cd ios && pod install
```

#### "Web Build Authentication Issues"
```javascript
// Ensure Firebase config includes all required fields for web:
EXPO_PUBLIC_FIREBASE_API_KEY=your-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-domain.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id

// Missing authDomain is a common cause of web auth failures
```

## 📚 Next Steps

Now that you have the app running:

1. **Read the Architecture**: [System Overview](../architecture/overview.md)
2. **Understand Auth**: [Authentication Guide](./authentication.md)
3. **Learn Development Flow**: [Feature Development Workflow](./feature-development-workflow.md)
4. **Review Code Standards**: [Development Guide](./development.md)
5. **Explore Features**: Check `/docs/features/` for feature-specific guides

## 🤝 Getting Help

- **Documentation**: Check `/docs` folder
- **Code Examples**: Look for similar patterns in codebase
- **Issues**: Create an issue in GitHub
- **Team**: Reach out to team members

## 📦 Useful Commands

```bash
# Development
npm run dev              # Start everything
npm run dev:ios          # iOS only
npm run dev:android      # Android only
npm run dev:backend      # Backend only

# Type Checking
npm run typecheck        # Check all TypeScript
cd app && npx tsc        # Frontend types only
cd server && npx tsc     # Backend types only

# Linting
npm run lint             # Lint all code
npm run lint:fix         # Auto-fix issues

# Database
mongosh                  # MongoDB shell
npm run db:seed          # Seed test data (if available)

# Clean
npm run clean            # Clean all builds
watchman watch-del-all   # Clear watchman
npx expo start -c        # Clear Metro cache

# Debugging Console Logs
# The app has minimal console logging for production readiness
# Error logs are preserved for debugging issues
# To see more verbose logging during development:
# 1. Check for console.error() statements in the code
# 2. TRPC errors will show as [TRPC] Response not OK
# 3. Auth errors will show as [AuthProvider] Failed to...
```

## ✅ Setup Checklist

- [ ] Node.js 18+ installed
- [ ] MongoDB running
- [ ] Firebase project created
- [ ] Environment variables configured
- [ ] Dependencies installed (`npm install`)
- [ ] iOS pods installed (Mac only)
- [ ] Backend running (`npm run dev:backend`)
- [ ] Frontend running (`npm run dev:ios/android`)
- [ ] Can create user account
- [ ] User appears in MongoDB

Congratulations! You're ready to start developing! 🎉