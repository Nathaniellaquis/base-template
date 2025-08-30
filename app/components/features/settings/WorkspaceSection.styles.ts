import { StyleSheet } from 'react-native';
import { Theme } from '@/styles';

export const createWorkspaceSectionStyles = (theme: Theme) =>
  StyleSheet.create({
    section: {
      marginBottom: theme.spacing.md,
    },
    sectionTitle: {
      marginBottom: theme.spacing.md,
    },
    infoRow: {
      marginBottom: theme.spacing.md,
    },
    label: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.gray[600],
      marginBottom: theme.spacing.xs,
    },
    workspaceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    workspaceName: {
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    createButton: {
      marginTop: theme.spacing.sm,
    },
    memberInfo: {
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.gray[200],
    },
    memberCount: {
      color: theme.colors.gray[600],
    },
    
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: theme.borderRadius.lg,
      borderTopRightRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing.xl * 2,
    },
    modalTitle: {
      marginBottom: theme.spacing.lg,
      textAlign: 'center',
    },
    workspaceOption: {
      marginBottom: theme.spacing.sm,
    },
    cancelButton: {
      marginTop: theme.spacing.md,
    },
    input: {
      backgroundColor: theme.colors.gray[100],
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text,
      marginBottom: theme.spacing.lg,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    modalButton: {
      flex: 1,
    },
  });