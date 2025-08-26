/**
 * Theme Provider Types
 * 
 * Type definitions for the theme provider
 */

import { ReactNode } from 'react';
import { Theme } from '@/types/theme';

export interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: 'light' | 'dark' | 'system';
}

export interface ThemeContextValue {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: 'light' | 'dark') => void;
}