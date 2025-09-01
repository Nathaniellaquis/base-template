import React, { useState, useEffect } from 'react';
import { View, Alert, FlatList, StyleSheet } from 'react-native';
import { useThemedStyles } from '@/styles';
import { Card, Text, Button, Input } from '@/components/ui';
import { trpc } from '@/lib';
import { useAuth } from '@/providers/auth';
import type { Theme } from '@/types/theme';

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
  },
  searchContainer: {
    marginBottom: theme.spacing.lg,
  },
  userCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  userInfo: {
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primary,
  },
  adminBadge: {
    backgroundColor: theme.colors.danger,
  },
  roleBadgeText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  userDetails: {
    fontSize: 14,
    color: theme.colors.gray[600],
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});

export default function AdminUsers() {
  const styles = useThemedStyles(createStyles);
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  
  // Get users
  const { data: usersData, refetch } = trpc.admin.getAllUsers.useQuery({
    limit: 50,
    search: search || undefined,
  });
  
  // Promote/demote mutation
  const updateRole = trpc.admin.promoteToAdmin.useMutation();
  
  // Delete user mutation
  const deleteUserMutation = trpc.admin.deleteUser.useMutation();
  
  useEffect(() => {
    if (updateRole.isSuccess && updateRole.data) {
      Alert.alert(
        'Success', 
        `User ${updateRole.data.role === 'admin' ? 'promoted to admin' : 'demoted to regular user'}`
      );
      refetch();
    }
    if (updateRole.isError) {
      Alert.alert('Error', updateRole.error?.message || 'Failed to update user role');
    }
  }, [updateRole.isSuccess, updateRole.isError, updateRole.data, updateRole.error?.message, refetch]);
  
  useEffect(() => {
    if (deleteUserMutation.isSuccess) {
      Alert.alert('Success', 'User has been deleted');
      refetch();
    }
    if (deleteUserMutation.isError) {
      Alert.alert('Error', deleteUserMutation.error?.message || 'Failed to delete user');
    }
  }, [deleteUserMutation.isSuccess, deleteUserMutation.isError, deleteUserMutation.error?.message, refetch]);
  
  const handleRoleChange = (userId: string, currentRole?: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const action = newRole === 'admin' ? 'promote' : 'demote';
    
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${action} this user?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => updateRole.mutate({ userId, role: newRole }),
        },
      ]
    );
  };
  
  const handleDeleteUser = (userId: string, email: string) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${email}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.prompt(
              'Confirm Deletion',
              'Please provide a reason for deletion (optional):',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: (reason) => deleteUserMutation.mutate({ userId, reason }),
                },
              ],
              'plain-text',
              ''
            );
          },
        },
      ]
    );
  };
  
  const renderUser = ({ item }: { item: any }) => {
    const itemId = item._id?.toString() || item._id || item.uid;
    const currentUserId = currentUser?._id?.toString() || currentUser?._id || currentUser?.uid;
    const isCurrentUser = itemId === currentUserId;
    const isAdmin = item.role === 'admin';
    
    return (
      <Card style={styles.userCard}>
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <Text style={styles.userEmail}>{item.email}</Text>
            {item.displayName && (
              <Text style={styles.userDetails}>Name: {item.displayName}</Text>
            )}
            <Text style={styles.userDetails}>
              ID: {item._id?.toString() || item._id || item.uid || 'N/A'}
            </Text>
            <Text style={styles.userDetails}>
              Joined: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
            </Text>
            {item.onboardingCompleted && (
              <Text style={styles.userDetails}>
                 Onboarding completed
              </Text>
            )}
          </View>
          <View style={[styles.roleBadge, isAdmin && styles.adminBadge]}>
            <Text style={styles.roleBadgeText}>
              {isAdmin ? 'ADMIN' : 'USER'}
            </Text>
          </View>
        </View>
        
        <View style={styles.actionButtons}>
          <Button
            title={isAdmin ? 'Demote to User' : 'Promote to Admin'}
            variant={isAdmin ? 'danger' : 'primary'}
            size="small"
            onPress={() => handleRoleChange(item._id?.toString() || item._id || item.uid || '', item.role)}
            disabled={isCurrentUser || updateRole.isPending}
            style={styles.actionButton}
          />
          <Button
            title="Delete User"
            variant="danger"
            size="small"
            onPress={() => handleDeleteUser(item._id?.toString() || item._id || item.uid || '', item.email)}
            disabled={isCurrentUser || deleteUserMutation.isPending}
            style={styles.actionButton}
          />
        </View>
      </Card>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <Input
            placeholder="Search by email or name..."
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>
        
        {/* Stats */}
        <Card style={{ padding: 16, marginBottom: 16 }}>
          <Text variant="body">
            Total Users: {usersData?.total || 0}
          </Text>
        </Card>
        
        {/* Users List */}
        <FlatList
          data={usersData?.users || []}
          renderItem={renderUser}
          keyExtractor={(item) => item._id?.toString() || item._id || item.uid || ''}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Card style={{ padding: 32, alignItems: 'center' }}>
              <Text variant="body">No users found</Text>
            </Card>
          }
        />
      </View>
    </View>
  );
}