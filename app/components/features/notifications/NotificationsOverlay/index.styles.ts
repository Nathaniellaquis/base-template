// +expo-router-ignore
import { StyleSheet } from 'react-native';
import type { Theme } from '@/types/theme';

export const createNotificationsOverlayStyles = (theme: Theme) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    marginTop: 100, // Start below status bar + some space
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.semibold,
  },
  placeholder: {
    width: 32 + theme.spacing.xs * 2, // Match back button width for centering
  },
});