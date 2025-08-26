// +expo-router-ignore
import { Theme } from '@/types/theme';

export const createHomeStyles = (theme: Theme) => ({
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  appName: {
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  notificationButton: {
    position: 'relative' as const,
    padding: theme.spacing.xs,
  },
  dashboardContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: theme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: theme.colors.background,
  },
  welcomeSection: {
    marginBottom: theme.spacing.md,
  },
  infoSection: {
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.mode === 'dark' ? theme.colors.gray[800] : theme.colors.gray[100],
  },
  infoRowLast: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: theme.spacing.sm,
  },
  actionButton: {
    backgroundColor: theme.mode === 'dark' ? theme.colors.gray[800] : theme.colors.gray[100],
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.base,
    marginBottom: theme.spacing.sm,
  },
  actionButtonText: {
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.medium,
    fontSize: theme.typography.fontSize.base,
  },
  actionButtonSubtext: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    marginTop: theme.spacing.xs,
  },
  verifyButton: {
    backgroundColor: theme.mode === 'dark' ? '#92400E' : '#FEF3C7',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.base,
  },
  verifyButtonText: {
    color: theme.mode === 'dark' ? '#FDE68A' : '#78350F',
    fontWeight: theme.typography.fontWeight.medium,
    fontSize: theme.typography.fontSize.base,
  },
  verifyButtonSubtext: {
    color: theme.mode === 'dark' ? '#FBBF24' : '#C2410C',
    fontSize: theme.typography.fontSize.sm,
    marginTop: theme.spacing.xs,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
  },
  statusText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  statusTextActive: {
    color: theme.colors.success,
  },
  statusTextInactive: {
    color: theme.colors.textSecondary,
  },
});