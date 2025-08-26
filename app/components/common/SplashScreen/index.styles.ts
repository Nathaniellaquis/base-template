import { Theme } from '@/types/theme';

export const createSplashScreenStyles = (theme: Theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  content: {
    alignItems: 'center' as const,
    paddingHorizontal: theme.spacing.xxl,
  },
  logo: {
    marginBottom: theme.spacing.sm,
  },
  tagline: {
    marginBottom: theme.spacing.xxxl,
  },
  loader: {
    marginTop: theme.spacing.lg,
  },
});