import { Theme } from '@/types/theme';

export const createLoadingScreenStyles = (theme: Theme) => ({
  container: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: theme.colors.background,
  },
  messageText: {
    marginTop: theme.spacing.md,
  },
});