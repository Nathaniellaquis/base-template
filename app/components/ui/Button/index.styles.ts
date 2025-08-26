import { Theme } from '@/types/theme';

export const createButtonStyles = (theme: Theme) => ({
  button: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm + 4,
    borderRadius: theme.borderRadius.base,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
  },
  buttonSmall: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs + 2,
  },
  buttonLarge: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  buttonSecondary: {
    backgroundColor: theme.mode === 'dark' ? theme.colors.gray[700] : theme.colors.gray[200],
  },
  buttonDanger: {
    backgroundColor: theme.colors.danger,
  },
  buttonOutline: {
    backgroundColor: theme.colors.transparent,
    borderWidth: 1,
    borderColor: theme.mode === 'dark' ? theme.colors.border : theme.colors.gray[300],
  },
  buttonDisabled: {
    backgroundColor: theme.mode === 'dark' ? theme.colors.gray[800] : theme.colors.gray[200],
    opacity: 0.6,
  },
  buttonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.white,
  },
  buttonTextSmall: {
    fontSize: theme.typography.fontSize.sm,
  },
  buttonTextSecondary: {
    color: theme.mode === 'dark' ? theme.colors.text : theme.colors.gray[700],
  },
  buttonTextOutline: {
    color: theme.mode === 'dark' ? theme.colors.text : theme.colors.gray[700],
  },
  iconContainer: {
    marginRight: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
});