# INGRD - Full-Stack React Native + Express App

A production-ready full-stack application with React Native (Expo) frontend and Express backend, featuring Firebase authentication and shared TypeScript types.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your Firebase config

# Run both frontend and backend
npm run dev
```

## 📁 Project Structure

```
├── app/              # React Native app (iOS, Android, Web)
│   ├── app/         # Expo Router pages
│   ├── components/  # Reusable UI components
│   ├── config/      # Firebase configuration
│   ├── hooks/       # Custom hooks (useAuth, useMediaQuery)
│   └── services/    # API utilities
├── server/          # Express.js backend
│   ├── firebase/    # Firebase Admin setup
│   └── i.ts         # Server entry point
└── types/           # Shared TypeScript types
```

## ✨ Features

- **🔐 Firebase Authentication**: Email/password auth with token management
- **📱 Multi-Platform**: iOS, Android, and Web from one codebase
- **🎨 NativeWind**: Tailwind CSS for React Native
- **🔄 Shared Types**: Type safety across frontend and backend
- **🚀 Hot Reload**: Fast development with Metro and Nodemon
- **🌐 API Ready**: Express server with Firebase auth middleware

## 📱 Frontend (Expo)

- **Framework**: React Native with Expo SDK 53
- **Routing**: File-based routing with Expo Router
- **Styling**: NativeWind (Tailwind CSS)
- **State**: React Context for auth
- **Types**: Full TypeScript support

## 🚀 Backend (Express)

- **Framework**: Express.js with TypeScript
- **Auth**: Firebase Admin SDK
- **Middleware**: Token verification
- **Types**: Shared with frontend via `@shared/*` alias

## 🏃 Commands

```bash
# Development
npm run dev          # Start both frontend & backend
npm run web          # Start Expo web
npm run ios          # iOS simulator
npm run android      # Android emulator
npm run server       # Backend only

# Build
npm run build:web    # Export web app
npm run build:ios    # EAS build for iOS
npm run build:android # EAS build for Android
npm run build:server # Compile TypeScript server

# Quality
npm run lint         # Run ESLint
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:3000

# Firebase Configuration (get from Firebase Console)
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
# ... etc
```

### Firebase Setup

1. Create a Firebase project
2. Enable Authentication (Email/Password)
3. Add your app's config to `.env`
4. Download service account key for server

## 🛠️ Key Improvements Made

- ✅ Consolidated user types into single `User` interface
- ✅ Simplified auth with token caching & auto-refresh
- ✅ Replaced class-based API service with simple utilities
- ✅ Fixed error handling with consistent `AppError` type
- ✅ Removed empty directories and redundant files
- ✅ Environment-based Firebase configuration
- ✅ Unified naming throughout the project

## 📚 Usage Examples

### Authentication
```tsx
const { user, token, signIn, signOut } = useAuth();

// Sign in
await signIn('email@example.com', 'password');

// Make authenticated API call
const data = await api.get('/profile', token);
```

### Responsive Design
```tsx
const { isMobile, isDesktop } = useBreakpoints();

<View className={isDesktop ? "flex-row" : "flex-col"}>
  {/* Responsive layout */}
</View>
```

## 🚢 Deployment

- **Web**: Deploy to Vercel/Netlify with `npm run build:web`
- **Mobile**: Use EAS Build for app stores
- **Server**: Deploy to Railway/Render/AWS

---

Built with ❤️ using Expo, Express, and TypeScript