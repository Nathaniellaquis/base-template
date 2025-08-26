# Theme Provider Safe Area Integration Proposal

## Executive Summary

This proposal outlines the integration of safe area insets into the existing theme provider, maintaining the current architecture while solving the safe area handling issue across all screens in a clean, consistent manner.

## Problem Statement

Currently, each screen must individually handle safe areas by:
- Importing `useSafeAreaInsets` from `react-native-safe-area-context`
- Manually applying padding to containers or scroll views
- Remembering which edges to apply for different screen types

This leads to:
- Repetitive boilerplate code
- Inconsistent implementations
- Potential for missed safe area handling on new screens

## Proposed Solution

Extend the existing theme provider to include safe area insets, making them available through the same context as theme values. This maintains the current architecture while providing a unified styling solution.

## Implementation Plan

### 1. Update Theme Provider Types

```typescript
// providers/theme/types.ts
import { EdgeInsets } from 'react-native-safe-area-context';

export interface ThemeContextValue {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: 'light' | 'dark') => void;
  safeAreaInsets: EdgeInsets; // Add this
}
```

### 2. Enhance Theme Provider

```typescript
// providers/theme/provider.tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function ThemeProvider({ 
  children, 
  defaultMode = 'system' 
}: ThemeProviderProps) {
  // Existing theme logic...
  
  // Get safe area insets
  const safeAreaInsets = useSafeAreaInsets();
  
  // Update context value
  const contextValue = useMemo(
    () => ({
      theme,
      isDarkMode,
      toggleTheme,
      setThemeMode,
      safeAreaInsets,
    }),
    [theme, isDarkMode, safeAreaInsets]
  );
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### 3. Extend useThemedStyles Hook

Update the existing `useThemedStyles` hook to optionally include safe area insets:

```typescript
// styles/index.ts

// Keep existing hook for backward compatibility
export const useThemedStyles = <T extends NamedStyles<T>>(
  stylesFn: (theme: Theme) => T
): T => {
  const { theme } = useThemeContext();
  
  return useMemo(
    () => createStyles(stylesFn(theme)),
    [theme]
  );
};

// Add new enhanced version
export const useThemedStylesWithInsets = <T extends NamedStyles<T>>(
  stylesFn: (theme: Theme, insets: EdgeInsets) => T
): T => {
  const { theme, safeAreaInsets } = useThemeContext();
  
  return useMemo(
    () => createStyles(stylesFn(theme, safeAreaInsets)),
    [theme, safeAreaInsets]
  );
};
```

### 4. Create Safe Area Style Utilities

Add utility functions following the existing pattern:

```typescript
// styles/index.ts

// Hook to get safe area insets from theme context
export const useSafeAreaInsets = () => {
  const { safeAreaInsets } = useThemeContext();
  return safeAreaInsets;
};

// Common safe area style patterns
export const useSafeAreaStyles = () => {
  const { theme, safeAreaInsets } = useThemeContext();
  
  return useMemo(() => ({
    // Container with top safe area (for tab screens)
    safeContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: safeAreaInsets.top,
    },
    
    // Container with all safe areas (for modal/full screens)
    safeContainerFull: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: safeAreaInsets.top,
      paddingBottom: safeAreaInsets.bottom,
      paddingLeft: safeAreaInsets.left,
      paddingRight: safeAreaInsets.right,
    },
    
    // ScrollView content with safe areas
    safeScrollContent: {
      paddingTop: safeAreaInsets.top,
      paddingBottom: safeAreaInsets.bottom,
    },
    
    // Tab screen scroll content (no bottom padding)
    tabScrollContent: {
      paddingTop: safeAreaInsets.top,
    },
    
    // Auth screen container (top and bottom)
    authContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: safeAreaInsets.top,
      paddingBottom: safeAreaInsets.bottom,
    },
  }), [theme, safeAreaInsets]);
};
```

### 5. Update Component Patterns

#### Option A: Using Pre-defined Safe Styles

```typescript
// Home screen example
export default function HomeScreen() {
  const styles = useThemedStyles(createHomeStyles);
  const safeStyles = useSafeAreaStyles();
  
  return (
    <ScrollView 
      style={styles.dashboardContainer}
      contentContainerStyle={safeStyles.tabScrollContent}
    >
      <View style={styles.contentContainer}>
        {/* Content */}
      </View>
    </ScrollView>
  );
}
```

#### Option B: Using Enhanced Style Factory

```typescript
// Create styles with insets
export const createHomeStyles = (theme: Theme, insets: EdgeInsets) => ({
  dashboardContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingTop: insets.top,
    paddingHorizontal: theme.spacing.lg,
  },
  // ... other styles
});

// Use in component
export default function HomeScreen() {
  const styles = useThemedStylesWithInsets(createHomeStyles);
  
  return (
    <ScrollView 
      style={styles.dashboardContainer}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Content */}
    </ScrollView>
  );
}
```

### 6. Migration Strategy

1. **Phase 1**: Implement enhanced theme provider without breaking changes
2. **Phase 2**: Add new hooks and utilities  
3. **Phase 3**: Gradually migrate screens using the new patterns
4. **Phase 4**: Deprecate direct `useSafeAreaInsets` imports

### 7. Export Updates

```typescript
// hooks/index.ts
export { 
  useTheme,
  useSafeAreaInsets, // New export from theme
  useSafeAreaStyles  // New export
} from '@/providers/theme';
```

## Benefits

1. **Consistency**: Single source of truth for both theme and safe areas
2. **Performance**: Leverages existing memoization patterns
3. **Developer Experience**: Familiar API that matches existing patterns
4. **Type Safety**: Full TypeScript support with existing types
5. **Backward Compatible**: No breaking changes to existing code
6. **Flexibility**: Multiple usage patterns for different needs

## Examples

### Tab Screen with ScrollView

```typescript
export default function ProfileScreen() {
  const styles = useThemedStyles(createProfileStyles);
  const { tabScrollContent } = useSafeAreaStyles();
  
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={tabScrollContent}
    >
      <UserProfile />
    </ScrollView>
  );
}
```

### Full Screen Modal

```typescript
export default function ModalScreen() {
  const styles = useThemedStyles(createModalStyles);
  const { safeContainerFull } = useSafeAreaStyles();
  
  return (
    <View style={[styles.container, safeContainerFull]}>
      {/* Modal content */}
    </View>
  );
}
```

### Custom Safe Area Usage

```typescript
export default function CustomScreen() {
  const { theme, safeAreaInsets } = useTheme();
  
  const dynamicStyle = {
    paddingTop: safeAreaInsets.top + theme.spacing.md,
  };
  
  return (
    <View style={dynamicStyle}>
      {/* Content */}
    </View>
  );
}
```

## Testing Plan

1. Test on various devices:
   - iPhone with Dynamic Island
   - iPhone with notch
   - iPhone SE (no notch)
   - Android with camera cutout
   - Android without cutout

2. Test scenarios:
   - Orientation changes
   - Tab navigation
   - Modal presentations
   - Keyboard interactions

## Success Metrics

1. All screens properly handle safe areas
2. No performance degradation
3. Reduced boilerplate code
4. Consistent safe area handling across the app
5. Easy adoption by developers

## Conclusion

This integration maintains the existing architecture while solving the safe area problem elegantly. It follows established patterns in the codebase, provides multiple usage options, and ensures backward compatibility while improving developer experience.