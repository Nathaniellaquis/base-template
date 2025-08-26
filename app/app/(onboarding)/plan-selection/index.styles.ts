// +expo-router-ignore
import { Theme } from '@/types/theme';

export const createStyles = (theme: Theme) => ({
  scrollContent: {
    flexGrow: 1,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.lg,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    textAlign: 'center' as const,
    marginBottom: theme.spacing.md,
  },
  billingContainer: {
    flexDirection: 'row' as const,
    marginBottom: theme.spacing.xs,
    alignSelf: 'center' as const,
    backgroundColor: theme.mode === 'dark' ? theme.colors.gray[800] : theme.colors.gray[100],
    borderRadius: theme.borderRadius.full,
    padding: 2,
  },
  billingOption: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'transparent' as const,
  },
  billingOptionActive: {
    backgroundColor: theme.mode === 'dark' ? theme.colors.gray[700] : theme.colors.white,
    ...theme.shadows.sm,
  },
  billingText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  billingTextActive: {
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  savingSubtext: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: theme.spacing.lg,
  },
  cardsContainer: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.mode === 'dark' ? theme.colors.surface : theme.colors.white,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.base,
    ...(theme.mode === 'dark' && {
      borderWidth: 1,
      borderColor: theme.colors.gray[800],
    }),
    position: 'relative' as const,
  },
  cardPro: {
    ...theme.shadows.md,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    ...theme.shadows.lg,
  },
  cardTouchable: {
    padding: theme.spacing.md,
  },
  planHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: theme.spacing.sm,
  },
  rightControls: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.spacing.sm,
  },
  recommendedBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.lg,
  },
  recommendedText: {
    fontSize: 11,
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
  planName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
  },
  priceContainer: {
    marginBottom: theme.spacing.sm,
  },
  priceRow: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
    gap: 2,
  },
  currencySymbol: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  price: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  period: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  planDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 18,
  },
  selectionIndicator: {
    width: 20,
    height: 20,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: theme.mode === 'dark' ? theme.colors.surface : theme.colors.white,
  },
  selectionIndicatorActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.text,
    borderWidth: 0,
  },
  benefitsToggle: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.spacing.xs,
  },
  benefitsToggleText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.medium,
  },
  expandedBenefitsList: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  expandedBenefitItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.spacing.sm,
  },
  expandedBenefitText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  termsContainer: {
    alignItems: 'center' as const,
    marginTop: theme.spacing.md,
  },
  termsText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center' as const,
  },
  termsLink: {
    textDecorationLine: 'underline' as const,
  },
  webModalContent: {
    padding: theme.spacing.lg,
  },
  webModalPlanInfo: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center' as const,
  },
});