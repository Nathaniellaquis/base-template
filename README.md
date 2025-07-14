# INGRD Monorepo

This project is organized as a monorepo with separate frontend and backend packages.

## Structure

```
ingrd/
├── app/          # React Native (Expo) frontend
├── server/       # Express + tRPC backend
├── types/        # Shared TypeScript types
└── package.json  # Root workspace configuration
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally
- Firebase project configured

### Installation

From the root directory:
```bash
npm install
```

This will install dependencies for both `app/` and `server/` packages.

### Development

Run both frontend and backend:
```bash
npm run dev
```

Or run them separately:
```bash
npm run dev:backend   # Start backend server
npm run dev:ios       # Start iOS app
```

### Environment Variables

Each package has its own `.env` file:
- `app/.env` - Frontend configuration (Firebase web config, API URL)
- `server/.env` - Backend configuration (MongoDB, Firebase Admin)

See `.env.example` files in each directory for required variables.

## Workspaces

This monorepo uses npm workspaces. The root `package.json` defines:
- `app` - Frontend package
- `server` - Backend package

All npm commands can be run from the root and will delegate to the appropriate workspace. 