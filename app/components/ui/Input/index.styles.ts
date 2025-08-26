import { Platform } from 'react-native';
import { Theme } from '@/types/theme';

export const createInputStyles = (theme: Theme) => ({
  input: {
    borderWidth: 1,
    borderColor: theme.mode === 'dark' ? theme.colors.gray[700] : theme.colors.gray[300],
    borderRadius: theme.borderRadius.base,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: Platform.OS === 'ios' ? theme.spacing.sm + 4 : theme.spacing.sm,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text,
    backgroundColor: theme.mode === 'dark' ? theme.colors.gray[900] : theme.colors.white,
  },
  inputFocused: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    // Adjust padding to prevent layout shift
    paddingHorizontal: theme.spacing.md - 1,
    paddingVertical: Platform.OS === 'ios' ? theme.spacing.sm + 3 : theme.spacing.sm - 1,
  },
  inputError: {
    borderColor: theme.colors.danger,
    borderWidth: 2,
    paddingHorizontal: theme.spacing.md - 1,
    paddingVertical: Platform.OS === 'ios' ? theme.spacing.sm + 3 : theme.spacing.sm - 1,
  },
  inputDisabled: {
    backgroundColor: theme.mode === 'dark' ? theme.colors.gray[800] : theme.colors.gray[100],
    color: theme.colors.gray[500],
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.mode === 'dark' ? theme.colors.gray[300] : theme.colors.gray[700],
    marginBottom: theme.spacing.xs,
  },
  helperText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.gray[500],
    marginTop: theme.spacing.xs,
  },
  errorText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.danger,
    marginTop: theme.spacing.xs,
  },
});