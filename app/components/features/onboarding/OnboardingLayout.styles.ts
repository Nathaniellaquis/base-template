import { Platform } from 'react-native';
import { Theme } from '@/types/theme';

export const createStyles = (theme: Theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + '20',
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: '100%' as const,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  stepText: {
    textAlign: 'center' as const,
    marginTop: theme.spacing.sm,
    fontSize: 12,
    color: theme.colors.textSecondary,
    opacity: 0.6,
  },
  contentContainer: {
    flex: 1,
  },
  bottomContainer: {
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border + '20',
    paddingTop: theme.spacing.md,
    paddingBottom: Platform.select({
      ios: theme.spacing.md,
      android: theme.spacing.lg,
    }),
    paddingHorizontal: theme.spacing.xl,
  },
  buttonWrapper: {
    width: '100%' as const,
  },
});