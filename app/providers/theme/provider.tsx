/**
 * Theme Provider
 * 
 * Manages application theme (light/dark mode) with system preference support
 */

import React, { createContext, useContext, useState, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '@/styles/themes';
import type { ThemeContextValue, ThemeProviderProps } from './types';

// Create the context
export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Provider component
export function ThemeProvider({ 
  children, 
  defaultMode = 'system' 
}: ThemeProviderProps) {
  // Get system color scheme
  const systemColorScheme = useColorScheme();
  
  // Track if user has manually set theme
  const [userPreference, setUserPreference] = useState<'light' | 'dark' | null>(
    defaultMode === 'system' ? null : defaultMode
  );
  
  // Determine active theme based on user preference or system
  const isDarkMode = userPreference 
    ? userPreference === 'dark' 
    : systemColorScheme === 'dark';
  
  // Toggle between light and dark mode
  const toggleTheme = () => {
    setUserPreference(isDarkMode ? 'light' : 'dark');
  };
  
  // Set specific theme mode
  const setThemeMode = (mode: 'light' | 'dark') => {
    setUserPreference(mode);
  };
  
  // Memoize the theme object to prevent unnecessary re-renders
  const theme = useMemo(
    () => (isDarkMode ? darkTheme : lightTheme),
    [isDarkMode]
  );
  
  // Memoize the context value
  const contextValue = useMemo(
    () => ({
      theme,
      isDarkMode,
      toggleTheme,
      setThemeMode,
    }),
    [theme, isDarkMode]
  );
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Main hook to use the theme
export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}