# Provider Structure Template

## Standard Provider Directory Structure

```
/providers/[provider-name]/
├── index.tsx           # Main exports (always present)
├── provider.tsx        # Provider implementation (single platform)
├── provider.native.tsx # Native implementation (if platform-specific)
├── provider.web.tsx    # Web implementation (if platform-specific)
├── context.ts          # Context definition (optional, can be in provider.tsx)
├── types.ts            # TypeScript types and interfaces
├── hooks.ts            # Custom hooks (if multiple hooks beyond main)
└── utils.ts            # Utility functions (if needed)
```

## File Templates

### `index.tsx` - Main Export File
```typescript
/**
 * [Provider Name] Provider Exports
 * 
 * Central export point for all [provider] related functionality
 */

// Provider component
export { [Name]Provider } from './provider';

// Main hook
export { use[Name] } from './provider'; // or from './hooks' if multiple

// Additional hooks (if any)
export { 
  useAdditionalHook1,
  useAdditionalHook2 
} from './hooks';

// Types
export type { 
  [Name]ContextValue,
  [Name]Config,
  [Name]State
} from './types';

// Utils (if any)
export { 
  utility1,
  utility2 
} from './utils';
```

### `types.ts` - Type Definitions
```typescript
/**
 * [Provider Name] Types
 * 
 * Type definitions for the [provider name] provider
 */

import { ReactNode } from 'react';

export interface [Name]ProviderProps {
  children: ReactNode;
  config?: [Name]Config;
}

export interface [Name]Config {
  // Configuration options
}

export interface [Name]State {
  // State shape
}

export interface [Name]ContextValue {
  // Context value shape
  state: [Name]State;
  actions: [Name]Actions;
}

export interface [Name]Actions {
  // Available actions
}
```

### `provider.tsx` - Single Platform Provider
```typescript
/**
 * [Provider Name] Provider
 * 
 * [Description of what this provider does]
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { [Name]ContextValue, [Name]ProviderProps } from './types';

// Create context
const [Name]Context = createContext<[Name]ContextValue | undefined>(undefined);

// Provider component
export function [Name]Provider({ children, config }: [Name]ProviderProps) {
  const [state, setState] = useState(initialState);
  
  // Implementation...
  
  const value: [Name]ContextValue = {
    state,
    actions: {
      // Actions...
    }
  };
  
  return (
    <[Name]Context.Provider value={value}>
      {children}
    </[Name]Context.Provider>
  );
}

// Main hook
export function use[Name]() {
  const context = useContext([Name]Context);
  if (!context) {
    throw new Error('use[Name] must be used within [Name]Provider');
  }
  return context;
}
```

### `hooks.ts` - Additional Hooks (if needed)
```typescript
/**
 * [Provider Name] Hooks
 * 
 * Additional hooks for [provider name] functionality
 */

import { use[Name] } from './provider';

export function useSpecificFeature() {
  const { state, actions } = use[Name]();
  // Hook implementation
  return result;
}
```

## Platform-Specific Providers

For providers that need different implementations per platform:

### `provider.native.tsx` and `provider.web.tsx`
- Implement platform-specific logic
- Export the same interface

### `index.tsx` for platform-specific
```typescript
// Export from native file (Metro will resolve to .web on web platform)
export { [Name]Provider, use[Name] } from './provider.native';
export type { [Name]ContextValue } from './types';
```

## Migration Checklist

When standardizing an existing provider:

- [ ] Create `types.ts` with all type definitions
- [ ] Move provider implementation to `provider.tsx`
- [ ] Create proper `index.tsx` with all exports
- [ ] Move additional hooks to `hooks.ts` (if multiple)
- [ ] Move utility functions to `utils.ts` (if any)
- [ ] Update all imports throughout the codebase
- [ ] Add JSDoc comments to all exports
- [ ] Test that everything still works