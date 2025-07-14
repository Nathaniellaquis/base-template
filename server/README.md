# Server Architecture

This server implements a tRPC API with Express, Firebase Auth, and MongoDB.

## Structure

```
server/
├── index.ts             # Express server entry
├── config/              # App configuration  
├── db/                  # MongoDB connection
├── trpc/               # tRPC setup
│   ├── trpc.ts         # Core tRPC config
│   ├── context.ts      # Request context (auth)
│   └── app.ts          # Root router
├── routers/            # API endpoints
│   └── user/           # User endpoints
├── services/           # Business logic
│   └── userService.ts  # User operations
└── types/              # TypeScript types
```

## Key Features

- **Type-safe API**: tRPC provides end-to-end type safety
- **Firebase Auth**: Handles authentication
- **MongoDB**: Database with TypeScript models
- **Auto user creation**: Users created on first request

## Auth Endpoints

See [AUTH_ENDPOINTS.md](./AUTH_ENDPOINTS.md) for details on:
- Public vs Protected endpoints
- How to create new endpoints
- TypeScript benefits

## Auto-Recovery Flow

1. User signs up with Firebase
2. If backend is down/network fails, user still exists in Firebase
3. On next request, context detects missing MongoDB user
4. Automatically creates user and sets custom claims
5. Request continues normally

## API Endpoints

### User
- `user.get` - Get current user
- `user.create` - Create user after Firebase signup
- `user.update` - Update user profile

## Environment Variables

Create a `.env` file:
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017
FIREBASE_PROJECT_ID=your-project-id
```

## Running the Server

```bash
npm install
npm run dev
``` 