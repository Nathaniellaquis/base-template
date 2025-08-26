import { StyleSheet, ViewStyle, TextStyle, ImageStyle, Platform } from 'react-native';
import { useMemo } from 'react';
import { useTheme as useThemeContext } from '@/providers/theme';
import type { Theme } from '@/types/theme';
export type { Theme } from '@/types/theme';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export const createStyles = <T extends NamedStyles<T>>(styles: T | NamedStyles<T>): T => {
  return StyleSheet.create(styles) as T;
};

// Re-export theme definitions for easy access
export { lightTheme, darkTheme } from './themes';

// Import values from theme for consistency
import { lightTheme } from './themes';

// Use theme values as defaults for static exports
const defaultTheme = lightTheme;

// Common spacing values (from theme)
export const spacing = defaultTheme.spacing;

// Common font sizes (from theme)
export const fontSize = defaultTheme.typography.fontSize;

// Font weights (from theme)
export const fontWeight = defaultTheme.typography.fontWeight;

// Border radius (from theme)
export const borderRadius = defaultTheme.borderRadius;

// Shadows (from theme)
export const shadow = defaultTheme.shadows;

// Common styles that can be reused
// NOTE: These use light theme colors as defaults. For theme-aware styles, use useThemedStyles hook
export const commonStyles = createStyles({
  // Containers
  container: {
    flex: 1,
    backgroundColor: defaultTheme.colors.white,
  },
  containerGray: {
    flex: 1,
    backgroundColor: defaultTheme.colors.gray[50],
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: defaultTheme.colors.white,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: defaultTheme.colors.white,
  },
  
  // Typography
  heading1: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    color: defaultTheme.colors.gray[900],
    letterSpacing: -0.5,
  },
  heading2: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.semibold,
    color: defaultTheme.colors.gray[900],
    letterSpacing: -0.3,
  },
  heading3: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
    color: defaultTheme.colors.gray[900],
  },
  heading4: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: defaultTheme.colors.gray[900],
  },
  body: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.normal,
    color: defaultTheme.colors.gray[700],
    lineHeight: fontSize.base * 1.5,
  },
  bodySmall: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    color: defaultTheme.colors.gray[600],
    lineHeight: fontSize.sm * 1.5,
  },
  caption: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.normal,
    color: defaultTheme.colors.gray[500],
  },
  link: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: defaultTheme.colors.primary,
    textDecorationLine: 'underline',
  },
  
  // Buttons
  button: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.base,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonSmall: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  buttonLarge: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  buttonPrimary: {
    backgroundColor: defaultTheme.colors.primary,
  },
  buttonSecondary: {
    backgroundColor: defaultTheme.colors.gray[200],
  },
  buttonDanger: {
    backgroundColor: defaultTheme.colors.danger,
  },
  buttonOutline: {
    backgroundColor: defaultTheme.colors.transparent,
    borderWidth: 1,
    borderColor: defaultTheme.colors.gray[300],
  },
  buttonDisabled: {
    backgroundColor: defaultTheme.colors.gray[200],
    opacity: 0.6,
  },
  buttonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: defaultTheme.colors.white,
  },
  buttonTextSecondary: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: defaultTheme.colors.gray[700],
  },
  buttonTextSmall: {
    fontSize: fontSize.sm,
  },
  
  // Forms
  input: {
    borderWidth: 1,
    borderColor: defaultTheme.colors.gray[300],
    borderRadius: borderRadius.base,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm + 4 : spacing.sm,
    fontSize: fontSize.base,
    color: defaultTheme.colors.gray[900],
    backgroundColor: defaultTheme.colors.white,
  },
  inputFocused: {
    borderColor: defaultTheme.colors.primary,
  },
  inputError: {
    borderColor: defaultTheme.colors.danger,
  },
  inputDisabled: {
    backgroundColor: defaultTheme.colors.gray[100],
    color: defaultTheme.colors.gray[500],
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: defaultTheme.colors.gray[700],
    marginBottom: spacing.xs,
  },
  helperText: {
    fontSize: fontSize.sm,
    color: defaultTheme.colors.gray[500],
    marginTop: spacing.xs,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: defaultTheme.colors.danger,
    marginTop: spacing.xs,
  },
  
  // Cards
  card: {
    backgroundColor: defaultTheme.colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadow.base,
  },
  cardCompact: {
    backgroundColor: defaultTheme.colors.white,
    borderRadius: borderRadius.base,
    padding: spacing.sm,
    ...shadow.sm,
  },
  
  // Lists
  listItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: defaultTheme.colors.white,
  },
  listItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: defaultTheme.colors.gray[200],
  },
  listItemPressed: {
    backgroundColor: defaultTheme.colors.gray[50],
  },
  
  // Dividers
  divider: {
    height: 1,
    backgroundColor: defaultTheme.colors.gray[200],
    marginVertical: spacing.md,
  },
  
  // Layout utilities
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  column: {
    flexDirection: 'column',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  spaceAround: {
    justifyContent: 'space-around',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexWrap: {
    flexWrap: 'wrap',
  },
  
  // Spacing utilities
  p0: { padding: 0 },
  p1: { padding: spacing.xs },
  p2: { padding: spacing.sm },
  p3: { padding: spacing.md },
  p4: { padding: spacing.lg },
  p5: { padding: spacing.xl },
  
  px0: { paddingHorizontal: 0 },
  px1: { paddingHorizontal: spacing.xs },
  px2: { paddingHorizontal: spacing.sm },
  px3: { paddingHorizontal: spacing.md },
  px4: { paddingHorizontal: spacing.lg },
  px5: { paddingHorizontal: spacing.xl },
  
  py0: { paddingVertical: 0 },
  py1: { paddingVertical: spacing.xs },
  py2: { paddingVertical: spacing.sm },
  py3: { paddingVertical: spacing.md },
  py4: { paddingVertical: spacing.lg },
  py5: { paddingVertical: spacing.xl },
  
  m0: { margin: 0 },
  m1: { margin: spacing.xs },
  m2: { margin: spacing.sm },
  m3: { margin: spacing.md },
  m4: { margin: spacing.lg },
  m5: { margin: spacing.xl },
  
  mt0: { marginTop: 0 },
  mt1: { marginTop: spacing.xs },
  mt2: { marginTop: spacing.sm },
  mt3: { marginTop: spacing.md },
  mt4: { marginTop: spacing.lg },
  mt5: { marginTop: spacing.xl },
  
  mb0: { marginBottom: 0 },
  mb1: { marginBottom: spacing.xs },
  mb2: { marginBottom: spacing.sm },
  mb3: { marginBottom: spacing.md },
  mb4: { marginBottom: spacing.lg },
  mb5: { marginBottom: spacing.xl },
  
  ml0: { marginLeft: 0 },
  ml1: { marginLeft: spacing.xs },
  ml2: { marginLeft: spacing.sm },
  ml3: { marginLeft: spacing.md },
  ml4: { marginLeft: spacing.lg },
  ml5: { marginLeft: spacing.xl },
  
  mr0: { marginRight: 0 },
  mr1: { marginRight: spacing.xs },
  mr2: { marginRight: spacing.sm },
  mr3: { marginRight: spacing.md },
  mr4: { marginRight: spacing.lg },
  mr5: { marginRight: spacing.xl },
  
  // Width/Height utilities
  w100: { width: '100%' },
  h100: { height: '100%' },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  flex3: { flex: 3 },
  
  // Text alignment
  textLeft: { textAlign: 'left' },
  textCenter: { textAlign: 'center' },
  textRight: { textAlign: 'right' },
  
  // Position
  absolute: { position: 'absolute' },
  relative: { position: 'relative' },
  
  // Overflow
  overflowHidden: { overflow: 'hidden' },
  overflowVisible: { overflow: 'visible' },
});

// Helper function to combine styles
export function combineStyles(
  ...styles: (ViewStyle | TextStyle | ImageStyle | false | null | undefined | (ViewStyle | TextStyle | ImageStyle | false | null | undefined)[])[]
): (ViewStyle | TextStyle | ImageStyle)[] {
  return styles.filter(Boolean).flat() as (ViewStyle | TextStyle | ImageStyle)[];
}

// Helper to create consistent spacing
export const createSpacing = (multiplier: number) => spacing.md * multiplier;

// Helper to create responsive font size
export const responsiveFontSize = (size: number) => {
  // You can add platform-specific or screen-size logic here
  return Platform.select({
    ios: size,
    android: size - 1,
  }) || size;
};

// ===== THEME SUPPORT =====
// The following exports provide theme support while maintaining backwards compatibility

// Static exports for backwards compatibility (non-component use)
export const staticColors = defaultTheme.colors;
export const staticSpacing = spacing;
export const staticFontSize = fontSize;
export const staticFontWeight = fontWeight;
export const staticBorderRadius = borderRadius;
export const staticShadow = shadow;

// Hook to get the complete theme
export const useTheme = () => {
  return useThemeContext();
};

// Hook to get just the theme colors
export const useThemeColors = () => {
  const { theme } = useThemeContext();
  return theme.colors;
};

// Hook to get theme spacing
export const useThemeSpacing = () => {
  const { theme } = useThemeContext();
  return theme.spacing;
};

// Hook to get theme typography
export const useThemeTypography = () => {
  const { theme } = useThemeContext();
  return theme.typography;
};

// Hook to create themed styles
export const useThemedStyles = <T extends NamedStyles<T>>(
  stylesFn: (theme: Theme) => T
): T => {
  const { theme } = useThemeContext();
  
  return useMemo(
    () => createStyles(stylesFn(theme)),
    [theme]
  );
};