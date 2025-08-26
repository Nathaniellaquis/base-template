import { Theme } from '@/types/theme';

// Shared values that don't change between themes
const sharedSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
};

const sharedTypography = {
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 42,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

const sharedBorderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Light theme definition
export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    // Core brand colors
    primary: '#3B82F6',
    primaryDark: '#2563EB',
    primaryLight: '#60A5FA',
    secondary: '#10B981',
    secondaryDark: '#059669',
    
    // Semantic colors
    danger: '#EF4444',
    dangerLight: '#FCA5A5',
    warning: '#F59E0B',
    warningLight: '#FCD34D',
    success: '#10B981',
    info: '#3B82F6',
    error: '#EF4444',
    
    // UI colors
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    
    // Base colors
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
    
    // Gray scale
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
  },
  spacing: sharedSpacing,
  typography: sharedTypography,
  borderRadius: sharedBorderRadius,
  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    base: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 5,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
    },
  },
};

// Dark theme definition
export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    // Core brand colors (adjusted for dark mode)
    primary: '#60A5FA',
    primaryDark: '#3B82F6',
    primaryLight: '#93BBFC',
    secondary: '#34D399',
    secondaryDark: '#10B981',
    
    // Semantic colors (adjusted for dark mode)
    danger: '#F87171',
    dangerLight: '#FCA5A5',
    warning: '#FBBF24',
    warningLight: '#FDE68A',
    success: '#34D399',
    info: '#60A5FA',
    error: '#F87171',
    
    // UI colors (dark mode specific)
    background: '#111827',
    surface: '#1F2937',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    border: '#374151',
    
    // Base colors (same as light)
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
    
    // Gray scale (same values, but used differently in dark mode)
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
  },
  spacing: sharedSpacing,
  typography: sharedTypography,
  borderRadius: sharedBorderRadius,
  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15, // Higher opacity for dark mode
      shadowRadius: 3,
      elevation: 3,
    },
    base: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2, // Higher opacity for dark mode
      shadowRadius: 4,
      elevation: 4,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25, // Higher opacity for dark mode
      shadowRadius: 8,
      elevation: 6,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3, // Higher opacity for dark mode
      shadowRadius: 16,
      elevation: 10,
    },
  },
};