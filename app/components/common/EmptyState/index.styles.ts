import { Theme } from '@/types/theme';

export const createEmptyStateStyles = (theme: Theme) => ({
  container: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  icon: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    marginBottom: theme.spacing.sm,
    textAlign: 'center' as const,
  },
  message: {
    textAlign: 'center' as const,
    marginBottom: theme.spacing.xl,
  },
});