# 📚 INGRD Documentation

Welcome to the INGRD project documentation. This guide will help you understand the architecture, implement features, and maintain code quality.

## 🚦 Start Here

- **New Developer?** → [Getting Started Guide](./guides/getting-started.md)
- **Building a Feature?** → [Feature Development Workflow](./guides/feature-development-workflow.md)
- **Understanding the System?** → [System Overview](./architecture/overview.md)
- **Debugging Auth?** → [Authentication Guide](./guides/authentication.md)

## 🗂️ Documentation Structure

### 🏗️ Architecture
Core system design and technical decisions.

- **[System Overview](./architecture/overview.md)** - Complete architecture, data flow, and component interaction
- **[Type System](./architecture/types.md)** - Type organization, shared types, and validation patterns
- **[Directory Structure](./architecture/directory-structure.md)** - Project organization and file structure
- **[Caching Strategy](./architecture/caching-strategy.md)** - Data caching patterns with React Query
- **[Mutation Pattern](./architecture/mutation-pattern.md)** - Optimistic updates and data synchronization

### 📖 Development Guides
Step-by-step guides for development and implementation.

- **[Getting Started](./guides/getting-started.md)** ⭐ - Project setup, installation, and configuration
- **[Feature Development Workflow](./guides/feature-development-workflow.md)** ⭐ - Standard process for building features
- **[Authentication](./guides/authentication.md)** - Firebase + MongoDB dual auth system
- **[Development Standards](./guides/development.md)** - Coding standards, patterns, and best practices
- **[Code Improvements (2025)](./guides/code-improvements-2025.md)** 🆕 - Recent simplifications and consistency improvements

### 🚀 Features
Documentation for specific features and their implementation.

- **[Payment System](./features/payment.md)** 💳 - RevenueCat integration with cross-platform subscription management
- **[Notifications](./features/notifications.md)** 🔔 - Push notification system with multi-device support
- **[Onboarding](./features/onboarding.md)** 🎯 - User onboarding flow and configuration
- **[Admin System](./features/admin.md)** 👮 - Role-based admin dashboard and management
- **[Workspaces](./features/workspaces.md)** 🏢 - Optional multi-workspace feature with teams

## 🎯 Quick Start Guides

### For New Developers
1. Start with [System Overview](./architecture/overview.md) to understand the big picture
2. Read [Development Guide](./guides/development.md) for coding standards
3. Review [Authentication](./guides/authentication.md) to understand user management

### For Feature Development
1. Check [Type System](./architecture/types.md) for type organization
2. Follow patterns in [Development Guide](./guides/development.md)
3. Reference existing [Features](./features/) for implementation examples

### For Debugging
- Auth issues → [Authentication Guide](./guides/authentication.md#debugging-auth-issues)
- Type errors → [Type System](./architecture/types.md#common-issues)
- General patterns → [System Overview](./architecture/overview.md#common-issues--solutions)

## 📋 Common Tasks

### Adding a New Feature
1. Define shared types in `/types/`
2. Create TRPC router in `/server/routers/`
3. Add provider in `/app/providers/` if stateful
4. Create hooks in `/app/hooks/`
5. Build UI components
6. Document in `/docs/features/`

### Updating Documentation
1. Keep docs close to code changes
2. Update relevant guides when patterns change
3. Add examples for complex implementations
4. Include common issues and solutions

## 🔍 Documentation Map

```
docs/
├── README.md                 # This file - documentation index
├── architecture/            
│   ├── overview.md          # System design, data flow
│   └── types.md             # Type system organization
├── guides/                  
│   ├── getting-started.md   # Setup and installation
│   ├── authentication.md    # Auth implementation
│   ├── development.md       # Coding standards
│   └── feature-development-workflow.md # Feature process
├── features/               
│   ├── payment.md           # RevenueCat payment system
│   ├── admin.md            # Admin dashboard
│   ├── notifications.md    # Push notifications
│   ├── onboarding.md       # User onboarding
│   └── workspaces.md       # Multi-workspace feature
├── backend/
│   └── README.md           # Backend architecture overview
└── proposals/              # Future feature proposals
```

## 📝 Documentation Status

### ✅ Completed
- System Architecture Overview
- Type System Design (Updated with tRPC patterns)
- Authentication Flow
- Development Standards (Added TypeScript best practices)
- Feature Development Workflow
- Getting Started Guide
- Payment System (RevenueCat Integration - Cross-platform subscriptions)
- Notification System
- Onboarding Flow
- Admin System
- Workspaces (Optional feature with type-safe stub)
- TypeScript Configuration (All app code now compiles cleanly)

### 🚧 In Progress / Planned

#### High Priority (Blocking Development)
- [ ] **API Reference** - Complete TRPC endpoint documentation
- [ ] **Environment Configuration** - Detailed `.env` setup for all environments
- [ ] **Testing Guide** - Test setup, patterns, and strategies
- [ ] **Deployment Guide** - EAS Build, production deployment

#### Medium Priority (Important for Quality)
- [ ] **Component Library** - UI component documentation
- [ ] **Hooks Reference** - Custom hooks documentation
- [ ] **Error Handling Guide** - Error patterns and user messaging
- [ ] **Performance Guide** - Optimization techniques
- [ ] **Security Guide** - Security best practices

#### Low Priority (Nice to Have)
- [ ] **Theming Guide** - Complete theme system documentation
- [ ] **Database Guide** - MongoDB schema and indexing
- [ ] **Mobile Platform Guides** - iOS/Android specific setup
- [ ] **Monitoring Guide** - Logging and analytics
- [ ] **Migration Guide** - Database and code migrations

## 💡 Contributing to Docs

### Documentation Standards
- Use clear, concise language
- Include code examples
- Add diagrams for complex flows
- Keep updated with code changes
- Test all code examples

### Documentation Template
```markdown
# Feature Name

## Overview
Brief description of what this feature does.

## Architecture
How it fits into the system.

## Implementation
Step-by-step guide.

## API Reference
Available methods and endpoints.

## Common Issues
Known problems and solutions.

## Examples
Working code examples.
```

## 🔗 External Resources

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [TRPC Documentation](https://trpc.io/docs)
- [MongoDB Manual](https://www.mongodb.com/docs/manual/)
- [Firebase Documentation](https://firebase.google.com/docs)