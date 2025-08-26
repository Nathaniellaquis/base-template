import { Theme } from '@/types/theme';

export const createTextStyles = (theme: Theme) => ({
  h1: {
    fontSize: theme.typography.fontSize['4xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    letterSpacing: -0.5,
    lineHeight: theme.typography.fontSize['4xl'] * theme.typography.lineHeight.tight,
  },
  h2: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    letterSpacing: -0.3,
    lineHeight: theme.typography.fontSize['3xl'] * theme.typography.lineHeight.tight,
  },
  h3: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    lineHeight: theme.typography.fontSize['2xl'] * theme.typography.lineHeight.normal,
  },
  h4: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    lineHeight: theme.typography.fontSize.xl * theme.typography.lineHeight.normal,
  },
  body: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.normal,
    color: theme.colors.text,
    lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.normal,
  },
  bodySmall: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.normal,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
  },
  caption: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.normal,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.fontSize.xs * theme.typography.lineHeight.normal,
  },
  link: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.primary,
    textDecorationLine: 'underline' as const,
    lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.normal,
  },
});