// +expo-router-ignore
import { Theme } from '@/types/theme';

export const createWelcomeStyles = (theme: Theme) => ({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: theme.spacing.xl,
  },
  content: {
    alignItems: 'center' as const,
    width: '100%' as const,
    maxWidth: 400,
  },
  icon: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    textAlign: 'center' as const,
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    textAlign: 'center' as const,
    marginBottom: theme.spacing.xl,
    opacity: 0.8,
  },
});