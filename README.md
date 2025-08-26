# INGRD Monorepo

A full-stack React Native application with Express backend, featuring authentication, theming, notifications, and admin capabilities.

## 📚 Documentation

All documentation is organized in the [`/docs`](./docs) folder for better maintainability.

### 🚦 Quick Start
- **[Getting Started](./docs/guides/getting-started.md)** - Set up your development environment
- **[Documentation Index](./docs/README.md)** - Browse all documentation

### 🛠️ Development
- **[Feature Development Workflow](./docs/guides/feature-development-workflow.md)** - How to build new features
- **[System Architecture](./docs/architecture/overview.md)** - High-level system design
- **[Development Standards](./docs/guides/development.md)** - Coding standards and patterns
- **[Authentication Deep Dive](./docs/guides/authentication.md)** - Auth system explained

## 🏗️ Structure

```
ingrd/
├── app/          # React Native (Expo) frontend
├── server/       # Express + tRPC backend
├── types/        # Shared TypeScript types
├── scripts/      # Build and utility scripts
└── package.json  # Root workspace configuration
```

## ✨ Features

- 🔐 **Dual Authentication** - Firebase Auth + MongoDB user sync
- 🎨 **Theme System** - Light/Dark mode with typed theme objects
- 📱 **Push Notifications** - Multi-device support via Expo
- 👤 **User Onboarding** - Multi-step wizard flow
- 👮 **Admin Dashboard** - Role-based access control
- 🔄 **Real-time Updates** - TRPC with React Query
- 📝 **Type Safety** - End-to-end TypeScript with Zod validation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally
- Firebase project configured
- iOS Simulator / Android Emulator (for mobile development)

### Installation

From the root directory:
```bash
npm install
```

This will install dependencies for both `app/` and `server/` packages.

### Configuration

1. **Firebase Setup**
   ```bash
   # Add your Firebase service account
   cp server/firebase-admin.example.json server/firebase-admin.json
   # Update with your Firebase project credentials
   ```

2. **Environment Variables**
   ```bash
   # Frontend config
   cp app/.env.example app/.env
   
   # Backend config  
   cp server/.env.example server/.env
   ```
   
   Required variables:
   - `app/.env` - Firebase web config, API URL
   - `server/.env` - MongoDB URI, Firebase admin path

### Development

Run both frontend and backend:
```bash
npm run dev
```

Or run them separately:
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:ios       # iOS
npm run dev:android   # Android  
npm run dev:web       # Web
```

## 🛠️ Tech Stack

### Frontend
- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform and tools
- **Expo Router** - File-based navigation
- **React Query** - Data fetching and caching
- **TRPC Client** - Type-safe API calls

### Backend
- **Express** - Node.js web framework
- **TRPC** - End-to-end typesafe APIs
- **MongoDB** - Document database
- **Firebase Admin** - Authentication and services
- **Zod** - Runtime validation

### Shared
- **TypeScript** - Type safety across stack
- **Monorepo** - NPM workspaces

## 📝 Common Tasks

### Adding a New Feature
1. Define types in `/types/` if shared
2. Create TRPC router in `/server/routers/`
3. Add provider in `/app/providers/` if needed
4. Create hooks in `/app/hooks/`
5. Build UI components

### Running Type Checks
```bash
# Check all TypeScript
npm run typecheck

# Frontend only
cd app && npx tsc --noEmit

# Backend only
cd server && npx tsc --noEmit
```

### Database Operations
```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/ingrd

# View users
db.users.find().pretty()

# Clear database (careful!)
db.dropDatabase()
```

## 🚢 Deployment

### Building for Production
```bash
# Build backend
cd server && npm run build

# Build mobile apps
cd app && expo build:ios
cd app && expo build:android
```

### Environment Management
- Development: `.env.development`
- Staging: `.env.staging`
- Production: `.env.production`

## 🧪 Testing

```bash
# Run all tests
npm test

# Frontend tests
npm run test:app

# Backend tests  
npm run test:server
```

## 📄 License

Private - All rights reserved 