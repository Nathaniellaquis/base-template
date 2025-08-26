import { Theme } from '@/types/theme';

export const createCardStyles = (theme: Theme) => ({
  card: {
    backgroundColor: theme.mode === 'dark' ? theme.colors.surface : theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.shadows.base,
    // Enhanced shadow for dark mode
    ...(theme.mode === 'dark' && {
      borderWidth: 1,
      borderColor: theme.colors.gray[800],
    }),
  },
  cardCompact: {
    backgroundColor: theme.mode === 'dark' ? theme.colors.surface : theme.colors.white,
    borderRadius: theme.borderRadius.base,
    padding: theme.spacing.sm,
    ...theme.shadows.sm,
    // Subtle border for dark mode
    ...(theme.mode === 'dark' && {
      borderWidth: 1,
      borderColor: theme.colors.gray[800],
    }),
  },
});