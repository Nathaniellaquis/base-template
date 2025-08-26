/**
 * Theme type definitions
 */

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
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  
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

export interface ThemeShadow {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface Theme {
  mode?: 'light' | 'dark';
  colors: ThemeColors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };
  typography: {
    fontSize: {
      xs: number;
      sm: number;
      base: number;
      lg: number;
      xl: number;
      '2xl': number;
      '3xl': number;
      '4xl': number;
      '5xl': number;
    };
    fontWeight: {
      normal: string;
      medium: string;
      semibold: string;
      bold: string;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  borderRadius: {
    none: number;
    sm: number;
    base: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  shadows: {
    sm: ThemeShadow;
    base: ThemeShadow;
    md: ThemeShadow;
    lg: ThemeShadow;
  };
}