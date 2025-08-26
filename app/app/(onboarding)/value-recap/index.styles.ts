// +expo-router-ignore
import { Theme } from '@/types/theme';

export const createStyles = (theme: Theme) => ({
  scrollContent: {
    flexGrow: 1,
    paddingTop: theme.spacing.xl,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  title: {
    textAlign: 'center' as const,
    marginBottom: theme.spacing.md,
    fontSize: 28,
    fontWeight: '700' as const,
  },
  subtitle: {
    textAlign: 'center' as const,
    marginBottom: theme.spacing.xl,
    opacity: 0.8,
    fontSize: 16,
  },
  valueContainer: {
    marginBottom: theme.spacing.xl,
  },
  valueCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    shadowColor: theme.shadows.sm.shadowColor,
    shadowOffset: theme.shadows.sm.shadowOffset,
    shadowOpacity: theme.shadows.sm.shadowOpacity,
    shadowRadius: theme.shadows.sm.shadowRadius,
    elevation: theme.shadows.sm.elevation,
  },
  valueIcon: {
    fontSize: 32,
    marginRight: theme.spacing.md,
  },
  valueTextContainer: {
    flex: 1,
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: 4,
  },
  valueDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  socialProofContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  statsRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    alignItems: 'center' as const,
  },
  stat: {
    alignItems: 'center' as const,
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: theme.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.border,
  },
  guaranteeText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xl,
    textAlign: 'center' as const,
  },
});