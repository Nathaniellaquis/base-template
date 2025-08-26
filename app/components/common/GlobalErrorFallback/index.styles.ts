import { StyleSheet } from 'react-native';
import { Theme } from '@/types/theme';

export const createGlobalErrorFallbackStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  content: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: theme.spacing.xl,
  },
  icon: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    textAlign: 'center' as const,
  },
  message: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: theme.spacing.xl,
    lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.normal,
    paddingHorizontal: theme.spacing.xl,
  },
  errorDetails: {
    backgroundColor: theme.mode === 'dark' ? theme.colors.gray[800] : theme.colors.gray[100],
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginVertical: theme.spacing.xl,
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.warning,
  },
  errorName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.warning,
    marginBottom: theme.spacing.xs,
  },
  errorMessage: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.warning,
    marginBottom: theme.spacing.md,
  },
  stackContainer: {
    maxHeight: 200,
  },
  stack: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.warning,
    fontFamily: 'monospace',
  },
  actions: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
    width: '100%',
    maxWidth: 300,
  },
});