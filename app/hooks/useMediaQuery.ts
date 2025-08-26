import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

/**
 * Hook to detect if a media query matches
 * @param query - Media query string (e.g., '(min-width: 768px)')
 * @returns boolean indicating if the query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Parse the query to extract the condition
    const checkQuery = () => {
      const { width } = Dimensions.get('window');
      
      // Extract min-width value from query
      const minWidthMatch = query.match(/\(min-width:\s*(\d+)px\)/);
      if (minWidthMatch) {
        const minWidth = parseInt(minWidthMatch[1], 10);
        setMatches(width >= minWidth);
        return;
      }

      // Extract max-width value from query
      const maxWidthMatch = query.match(/\(max-width:\s*(\d+)px\)/);
      if (maxWidthMatch) {
        const maxWidth = parseInt(maxWidthMatch[1], 10);
        setMatches(width <= maxWidth);
        return;
      }

      // Default to false if query is not recognized
      setMatches(false);
    };

    // Check on mount
    checkQuery();

    // Listen for dimension changes
    const subscription = Dimensions.addEventListener('change', checkQuery);

    return () => {
      subscription?.remove();
    };
  }, [query]);

  return matches;
}