# Dynamic Island & Camera Cutout Handling Proposal

## Executive Summary

This proposal outlines a comprehensive strategy for handling device camera cutouts (Dynamic Island, notches, hole-punch cameras) in our React Native application while maintaining full compatibility across iOS, Android, and web platforms.

## Current State Analysis

### What We Have
- Basic `react-native-safe-area-context` integration
- Standard `SafeAreaView` usage in auth layouts
- Manual padding calculations in SplashScreen
- No device-specific UI adaptations
- No Dynamic Island awareness

### What We Need
- Consistent safe area handling across all screens
- Dynamic Island-aware UI components
- Cross-platform cutout detection
- Enhanced user experience around device cutouts
- Performance-optimized implementation

## Proposed Solution

### 1. Foundation Layer: Enhanced Safe Area Management

#### 1.1 Standardize on `useSafeAreaInsets` Hook
Replace all `SafeAreaView` components with the more performant `useSafeAreaInsets` hook to avoid animation flickering and improve performance.

```typescript
// Before
<SafeAreaView style={styles.container}>
  <Content />
</SafeAreaView>

// After
const insets = useSafeAreaInsets();
<View style={[styles.container, { paddingTop: insets.top }]}>
  <Content />
</View>
```

#### 1.2 Create Device Detection Utility
Implement a comprehensive device detection system:

```typescript
// utils/device-detection.ts
export interface DeviceFeatures {
  hasDynamicIsland: boolean;
  hasNotch: boolean;
  hasCameraHole: boolean;
  cutoutType: 'none' | 'notch' | 'dynamic-island' | 'hole-punch';
  screenType: 'standard' | 'edge-to-edge';
}

export function useDeviceFeatures(): DeviceFeatures {
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get('window');
  
  // Dynamic Island detection (iPhone 14 Pro/Pro Max)
  const hasDynamicIsland = Platform.OS === 'ios' && insets.top === 59;
  
  // Notch detection (iPhone X-13)
  const hasNotch = Platform.OS === 'ios' && insets.top >= 44 && !hasDynamicIsland;
  
  // Android camera hole detection
  const hasCameraHole = Platform.OS === 'android' && insets.top > 24;
  
  return {
    hasDynamicIsland,
    hasNotch,
    hasCameraHole,
    cutoutType: determineCutoutType(insets),
    screenType: determineScreenType(insets),
  };
}
```

### 2. Component Layer: Dynamic Island-Aware Components

#### 2.1 Smart Header Component
Create a header that adapts to different cutout types:

```typescript
// components/ui/SmartHeader/index.tsx
export function SmartHeader({ title, showBack, actions }: SmartHeaderProps) {
  const { cutoutType } = useDeviceFeatures();
  const insets = useSafeAreaInsets();
  
  const headerHeight = useMemo(() => {
    switch (cutoutType) {
      case 'dynamic-island':
        return 70; // Extra space for Dynamic Island
      case 'notch':
        return insets.top + 44;
      default:
        return insets.top + 56;
    }
  }, [cutoutType, insets.top]);
  
  return (
    <View style={[styles.header, { height: headerHeight }]}>
      {/* Dynamic content positioning based on cutout */}
    </View>
  );
}
```

#### 2.2 Dynamic Island Integration Component
For iPhone 14 Pro+ devices, create an optional enhancement:

```typescript
// components/features/DynamicIslandEnhancement/index.tsx
export function DynamicIslandEnhancement({ children }: Props) {
  const { hasDynamicIsland } = useDeviceFeatures();
  
  if (!hasDynamicIsland) return children;
  
  return (
    <View>
      <DynamicIslandOverlay />
      {children}
    </View>
  );
}
```

### 3. Implementation Strategy

#### Phase 1: Foundation (Week 1)
1. Audit all screens for safe area usage
2. Create device detection utilities
3. Implement SmartHeader component
4. Update SafeAreaProvider configuration

#### Phase 2: Migration (Week 2)
1. Replace SafeAreaView with useSafeAreaInsets
2. Update all headers to use SmartHeader
3. Test on various devices
4. Fix edge cases

#### Phase 3: Enhancement (Week 3)
1. Add Dynamic Island enhancements
2. Implement Android cutout optimizations
3. Add web PWA support
4. Performance optimization

### 4. Technical Implementation Details

#### 4.1 Root Layout Configuration
```typescript
// app/_layout.tsx
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
```

#### 4.2 Android Configuration
Add to MainActivity.java for Android P+ support:
```java
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
    WindowManager.LayoutParams layoutParams = new WindowManager.LayoutParams();
    layoutParams.layoutInDisplayCutoutMode = 
        WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
    getWindow().setAttributes(layoutParams);
}
```

#### 4.3 Web Support
Update app.config.js:
```javascript
export default {
  web: {
    bundler: 'metro',
    viewport: {
      fit: 'cover',
      initialScale: 1,
      minimumScale: 1,
      maximumScale: 1,
    },
  },
};
```

### 5. Performance Considerations

1. **Memoization**: Cache device detection results to avoid recalculation
2. **Conditional Rendering**: Only apply cutout handling where necessary
3. **Animation Optimization**: Use `useSafeAreaInsets` to prevent flickering
4. **Lazy Loading**: Load Dynamic Island enhancements only on supported devices

### 6. Testing Strategy

#### Device Testing Matrix
- **iOS**: iPhone SE, iPhone 12 (notch), iPhone 14 Pro (Dynamic Island)
- **Android**: Pixel 3 (no cutout), Pixel 6 (hole punch), Samsung devices
- **Web**: Mobile Safari, Chrome Mobile, PWA mode

#### Test Cases
1. Orientation changes
2. Keyboard appearance/dismissal
3. Modal presentations
4. Navigation transitions
5. ScrollView behavior
6. FlatList rendering

### 7. Future Enhancements

1. **Live Activities Integration**: Connect to iOS Live Activities API
2. **Animation Library**: Add liquid/morphing animations around Dynamic Island
3. **Android 14+ Features**: Utilize new cutout APIs
4. **Accessibility**: Ensure screen readers work properly with cutouts

### 8. Migration Checklist

- [ ] Update SafeAreaProvider in root layout
- [ ] Create device detection utilities
- [ ] Implement SmartHeader component
- [ ] Replace SafeAreaView usage (11 files)
- [ ] Add Android MainActivity configuration
- [ ] Update web viewport configuration
- [ ] Test on physical devices
- [ ] Document usage patterns
- [ ] Create design guidelines

### 9. Code Examples

#### Basic Screen Template
```typescript
export function ExampleScreen() {
  const insets = useSafeAreaInsets();
  const { cutoutType } = useDeviceFeatures();
  
  return (
    <View style={styles.container}>
      <SmartHeader title="Example" />
      <ScrollView 
        contentContainerStyle={{
          paddingBottom: insets.bottom,
        }}
      >
        {/* Content */}
      </ScrollView>
    </View>
  );
}
```

#### Dynamic Island Enhancement
```typescript
export function NotificationBanner({ message }: Props) {
  const { hasDynamicIsland } = useDeviceFeatures();
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      top: hasDynamicIsland ? 65 : 10,
      transform: [{
        translateY: withSpring(visible.value ? 0 : -100),
      }],
    };
  });
  
  return (
    <Animated.View style={[styles.banner, animatedStyle]}>
      <Text>{message}</Text>
    </Animated.View>
  );
}
```

### 10. Success Metrics

1. **Performance**: No layout shifts or flickering
2. **Compatibility**: Works on 95%+ of devices
3. **User Experience**: Proper content visibility on all screens
4. **Developer Experience**: Easy-to-use components and utilities
5. **Maintenance**: Clear patterns and documentation

## Conclusion

This proposal provides a comprehensive approach to handling device cutouts while maintaining React Native's cross-platform benefits. By implementing these changes, we'll ensure our app looks modern and polished on all devices, from the latest iPhone 14 Pro with Dynamic Island to Android devices with hole-punch cameras and older devices with traditional displays.

The phased approach allows for incremental improvements while maintaining app stability, and the focus on performance ensures a smooth user experience across all platforms.