import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export const createStyles = <T extends NamedStyles<T>>(styles: T | NamedStyles<T>): T => {
  return StyleSheet.create(styles) as T;
};

// Common color palette
export const colors = {
  primary: '#3B82F6', // blue-500
  primaryDark: '#2563EB', // blue-600
  secondary: '#10B981', // green-500
  danger: '#EF4444', // red-500
  warning: '#F59E0B', // amber-500
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

// Common spacing values
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

// Common font sizes
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

// Common styles that can be reused
export const commonStyles = createStyles({
  // Containers
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  
  // Typography
  heading1: {
    fontSize: fontSize['3xl'],
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  heading2: {
    fontSize: fontSize['2xl'],
    fontWeight: '600',
    color: colors.gray[900],
  },
  heading3: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.gray[900],
  },
  body: {
    fontSize: fontSize.base,
    color: colors.gray[700],
  },
  bodySmall: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
  },
  
  // Buttons
  button: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.gray[200],
  },
  buttonDanger: {
    backgroundColor: colors.danger,
  },
  buttonText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.white,
  },
  buttonTextSecondary: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.gray[700],
  },
  
  // Forms
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: fontSize.base,
    color: colors.gray[900],
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: colors.danger,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  
  // Cards
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  
  // Lists
  listItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  
  // Utilities
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  mb4: {
    marginBottom: spacing.md,
  },
  mb2: {
    marginBottom: spacing.sm,
  },
  mt4: {
    marginTop: spacing.md,
  },
  px4: {
    paddingHorizontal: spacing.md,
  },
  py2: {
    paddingVertical: spacing.sm,
  },
});

// Helper function to combine styles
export const combineStyles = (...styles: any[]) => {
  return styles.filter(Boolean);
};