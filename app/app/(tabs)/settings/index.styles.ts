// +expo-router-ignore
import { Theme } from '@/types/theme';

export const createSettingsStyles = (theme: Theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  editRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  editInputContainer: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  editButtonsContainer: {
    flexDirection: 'row' as const,
  },
  editableRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  editLink: {
    padding: theme.spacing.xs,
  },
  preferenceRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: theme.spacing.md,
  },
  preferenceInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  warningBanner: {
    backgroundColor: theme.mode === 'dark' ? '#92400E' : '#FEF3C7',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.base,
  },
  warningTitle: {
    color: theme.mode === 'dark' ? '#FDE68A' : '#78350F',
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing.xs,
  },
  warningText: {
    color: theme.mode === 'dark' ? '#FBBF24' : '#C2410C',
    fontSize: theme.typography.fontSize.sm,
  },
  dangerTitle: {
    color: theme.colors.danger,
  },
  buttonSpacing: {
    marginBottom: theme.spacing.sm,
  },
  saveButton: {
    marginLeft: theme.spacing.sm,
  },
  sectionHeader: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  cardContent: {
    padding: theme.spacing.md,
  },
  subscriptionInfo: {
    alignItems: 'flex-start' as const,
  },
});