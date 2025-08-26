import { useRouter } from 'expo-router';
import type { AppRoute, NavigationTarget } from '@/types/routes';

/**
 * Type-safe wrapper around Expo Router
 */
export function useTypedRouter() {
  const router = useRouter();

  return {
    push: (target: NavigationTarget) => {
      if (typeof target === 'string') {
        // @ts-ignore - Expo Router types are not perfect
        router.push(target);
      } else {
        // @ts-ignore - Expo Router types are not perfect
        router.push(target);
      }
    },
    replace: (target: NavigationTarget) => {
      if (typeof target === 'string') {
        // @ts-ignore - Expo Router types are not perfect
        router.replace(target);
      } else {
        // @ts-ignore - Expo Router types are not perfect
        router.replace(target);
      }
    },
    back: () => router.back(),
    canGoBack: () => router.canGoBack(),
  };
}