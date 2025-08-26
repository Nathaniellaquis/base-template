// +expo-router-ignore
import { Theme } from '@/types/theme';

export const createProfileSetupStyles = (theme: Theme) => ({
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.lg,
  },
  content: {
    flex: 1,
    paddingTop: theme.spacing.xl,
  },
  title: {
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    marginBottom: theme.spacing.xl,
    opacity: 0.8,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
});