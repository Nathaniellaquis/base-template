// Theme type definitions for the app
// This provides full TypeScript support for our theme system

export interface ThemeColors {
  // Core brand colors
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  secondaryDark: string;
  
  // Semantic colors
  danger: string;
  dangerLight: string;
  warning: string;
  warningLight: string;
  success: string;
  info: string;
  error: string;
  
  // UI colors
  background: string;      // Main app background
  surface: string;         // Card/component backgrounds
  text: string;           // Primary text color
  textSecondary: string;  // Secondary/muted text
  border: string;         // Border colors
  
  // Base colors
  white: string;
  black: string;
  transparent: string;
  
  // Gray scale
  gray: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
}

export interface ThemeSpacing {
  xs: number;   // 4
  sm: number;   // 8
  md: number;   // 16
  lg: number;   // 24
  xl: number;   // 32
  xxl: number;  // 40
  xxxl: number; // 48
}

export interface ThemeTypography {
  fontSize: {
    xs: number;    // 12
    sm: number;    // 14
    base: number;  // 16
    lg: number;    // 18
    xl: number;    // 20
    '2xl': number; // 24
    '3xl': number; // 30
    '4xl': number; // 36
    '5xl': number; // 42
  };
  fontWeight: {
    normal: '400';
    medium: '500';
    semibold: '600';
    bold: '700';
  };
  lineHeight: {
    tight: number;    // 1.25
    normal: number;   // 1.5
    relaxed: number;  // 1.75
  };
}

export interface ThemeBorderRadius {
  none: number;  // 0
  sm: number;    // 4
  base: number;  // 8
  md: number;    // 12
  lg: number;    // 16
  xl: number;    // 24
  full: number;  // 9999
}

export interface ThemeShadow {
  shadowColor: string;
  shadowOffset: {
    width: number;
    height: number;
  };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number; // Android shadow
}

export interface ThemeShadows {
  sm: ThemeShadow;
  base: ThemeShadow;
  md: ThemeShadow;
  lg: ThemeShadow;
}

export interface Theme {
  mode: 'light' | 'dark';
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  borderRadius: ThemeBorderRadius;
  shadows: ThemeShadows;
}