import { useEffect, useState } from 'react';
import { Dimensions, Platform } from 'react-native';

interface MediaQueryOptions {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
}

export function useMediaQuery(options: MediaQueryOptions) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const checkMatch = () => {
      const { width, height } = Dimensions.get('window');
      
      let isMatch = true;
      
      if (options.minWidth !== undefined && width < options.minWidth) {
        isMatch = false;
      }
      if (options.maxWidth !== undefined && width > options.maxWidth) {
        isMatch = false;
      }
      if (options.minHeight !== undefined && height < options.minHeight) {
        isMatch = false;
      }
      if (options.maxHeight !== undefined && height > options.maxHeight) {
        isMatch = false;
      }
      
      setMatches(isMatch);
    };

    checkMatch();

    if (Platform.OS === 'web') {
      const handleResize = () => checkMatch();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    } else {
      const subscription = Dimensions.addEventListener('change', checkMatch);
      return () => subscription?.remove();
    }
  }, [options.minWidth, options.maxWidth, options.minHeight, options.maxHeight]);

  return matches;
}

export function useBreakpoints() {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  const isDesktop = useMediaQuery({ minWidth: 1024 });

  return {
    isMobile,
    isTablet,
    isDesktop,
    isSmallScreen: isMobile,
    isLargeScreen: isDesktop,
  };
}