// +expo-router-ignore
import { Theme } from '@/types/theme';

export const createStyles = (theme: Theme) => ({
  container: {
    flex: 1,
    justifyContent: 'center' as const,
    paddingHorizontal: theme.spacing.xl,
  },
  
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: theme.colors.text,
    textAlign: 'center' as const,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: theme.spacing.xxxl,
  },
  
  // Choice screen styles
  choiceCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    shadowColor: theme.shadows.sm.shadowColor,
    shadowOffset: theme.shadows.sm.shadowOffset,
    shadowOpacity: theme.shadows.sm.shadowOpacity,
    shadowRadius: theme.shadows.sm.shadowRadius,
    elevation: theme.shadows.sm.elevation,
  },
  choiceCardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: theme.spacing.sm,
  },
  choiceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: theme.spacing.md,
  },
  createIconContainer: {
    backgroundColor: `${theme.colors.primary}20`,
  },
  joinIconContainer: {
    backgroundColor: `${theme.colors.success}20`,
  },
  choiceTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: theme.colors.text,
  },
  choiceDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginLeft: 48 + theme.spacing.md, // Icon width + margin
  },

  // Form screen styles
  formContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    letterSpacing: 0, // Normal letter spacing
  },
  inviteCodeInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    fontSize: 32,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.xl,
    textAlign: 'center' as const,
    letterSpacing: 8,
  },
  
  // Workspace preview
  workspacePreview: {
    backgroundColor: theme.colors.success + '10',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  workspaceName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: theme.colors.success,
    marginBottom: 4,
  },
  workspaceInfo: {
    fontSize: 14,
    color: theme.colors.success,
    opacity: 0.8,
  },

  // Button styles
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center' as const,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },

  // Helper text
  helperText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center' as const,
    marginTop: theme.spacing.lg,
  },
  
  // Back button
  backButton: {
    marginBottom: theme.spacing.sm,
    marginLeft: -theme.spacing.sm,
    padding: theme.spacing.sm,
    alignSelf: 'flex-start' as const,
  },
  
  // Scroll content
  scrollContent: {
    flexGrow: 1,
    paddingTop: 0,
    paddingBottom: theme.spacing.xl,
  },
});