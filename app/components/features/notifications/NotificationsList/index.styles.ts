// +expo-router-ignore
import { StyleSheet } from 'react-native';
import type { Theme } from '@/types/theme';

export const createNotificationsListStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: theme.spacing.md,
  },
  
  // Notification item styles
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  unread: {
    backgroundColor: `${theme.colors.primary}1A`, // Primary with 10% opacity (1A in hex)
  },
  
  // Icon styles
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  
  // Content styles
  content: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  notificationTitle: {
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
    color: theme.colors.text,
  },
  notificationBody: {
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  timestamp: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  
  // Unread indicator
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginTop: theme.spacing.sm,
  },
  
  // Section header styles
  sectionHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  sectionTitle: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    fontSize: 12,
  },
});