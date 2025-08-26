import { StyleSheet } from 'react-native';
import { Theme } from '@/types/theme';

export const createStyles = (theme: Theme) => StyleSheet.create({
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
  },
  
  // Current Plan Display
  currentPlanContainer: {
    marginBottom: theme.spacing.lg,
  },
  planHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: theme.spacing.sm,
  },
  planName: {
    color: theme.colors.text,
  },
  billingPeriod: {
    color: theme.colors.gray[600],
    marginTop: theme.spacing.xs,
  },
  
  // Plan Badge
  planBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  basicBadge: {
    backgroundColor: theme.colors.primaryLight,
  },
  proBadge: {
    backgroundColor: theme.colors.secondary,
  },
  enterpriseBadge: {
    backgroundColor: theme.colors.warning,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.gray[800],
  },
  
  // Status Messages
  statusContainer: {
    marginTop: theme.spacing.sm,
  },
  warningBanner: {
    backgroundColor: theme.colors.dangerLight,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
  },
  warningText: {
    color: theme.colors.danger,
    fontSize: 14,
  },
  infoBanner: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    color: theme.colors.info,
    fontSize: 14,
  },
  
  // Actions
  actionsContainer: {
    gap: theme.spacing.sm,
  },
  actionButton: {
    marginBottom: theme.spacing.sm,
  },
  cancelLink: {
    textAlign: 'center' as const,
    color: theme.colors.danger,
    marginTop: theme.spacing.sm,
  },
  
  // Plan Selector
  planSelector: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
  },
  planSelectorTitle: {
    marginBottom: theme.spacing.md,
    textAlign: 'center' as const,
  },
  
  // Period Toggle
  periodToggle: {
    flexDirection: 'row' as const,
    backgroundColor: theme.colors.gray[100],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  periodOption: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center' as const,
  },
  periodOptionActive: {
    backgroundColor: theme.colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodOptionText: {
    color: theme.colors.gray[600],
    fontSize: 14,
    fontWeight: '500',
  },
  periodOptionTextActive: {
    color: theme.colors.text,
  },
  
  // Plan Options
  planOption: {
    borderWidth: 2,
    borderColor: theme.colors.gray[300],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  planOptionCurrent: {
    borderColor: theme.colors.gray[400],
    backgroundColor: theme.colors.gray[50],
  },
  planOptionRecommended: {
    borderColor: theme.colors.primary,
  },
  planOptionContent: {
    gap: theme.spacing.xs,
  },
  recommendedBadge: {
    position: 'absolute' as const,
    top: -10,
    right: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  recommendedText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  currentPlanLabel: {
    color: theme.colors.gray[500],
    fontSize: 12,
    marginTop: theme.spacing.xs,
  },
  cancelButton: {
    marginTop: theme.spacing.sm,
  },
  
  // Payment Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});