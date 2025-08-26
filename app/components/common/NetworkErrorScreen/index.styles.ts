import { StyleSheet } from 'react-native';
import { Theme } from '@/types/theme';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    content: {
      alignItems: 'center',
      maxWidth: 300,
    },
    icon: {
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xl,
    },
    title: {
      marginBottom: theme.spacing.md,
      textAlign: 'center',
      color: theme.colors.text,
    },
    description: {
      marginBottom: theme.spacing.xl,
      textAlign: 'center',
      color: theme.colors.textSecondary,
      lineHeight: 22,
    },
    buttonContainer: {
      width: '100%',
      marginTop: theme.spacing.md,
    },
    button: {
      width: '100%',
    },
    retryText: {
      marginBottom: theme.spacing.md,
      color: theme.colors.primary,
    },
    loadingIndicator: {
      marginTop: theme.spacing.lg,
      color: theme.colors.primary,
    },
  });