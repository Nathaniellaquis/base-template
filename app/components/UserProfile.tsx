import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { trpc } from '../lib/api';
import { combineStyles, commonStyles } from '../styles';

export function UserProfile() {
  // Fetch user data
  const { data: user, isLoading, error } = trpc.user.get.useQuery();
  
  // Update user mutation
  const updateUser = trpc.user.update.useMutation({
    onSuccess: () => {
      // Refetch user data after update
      trpc.user.get.useQuery();
    },
  });

  if (isLoading) {
    return (
      <View style={commonStyles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={commonStyles.centerContainer}>
        <Text style={commonStyles.errorText}>Error loading profile</Text>
      </View>
    );
  }

  return (
    <View style={combineStyles(commonStyles.container, commonStyles.px4)}>
      <Text style={commonStyles.heading2}>User Profile</Text>
      
      {user && (
        <>
          <Text style={commonStyles.body}>Email: {user.email}</Text>
          <Text style={commonStyles.body}>Display Name: {user.displayName || 'Not set'}</Text>
          <Text style={commonStyles.body}>Role: {user.role}</Text>
          
          <TouchableOpacity
            style={combineStyles(commonStyles.button, commonStyles.buttonPrimary, commonStyles.mt4)}
            onPress={() => {
              updateUser.mutate({
                displayName: 'New Name',
              });
            }}
            disabled={updateUser.isPending}
          >
            <Text style={commonStyles.buttonText}>
              {updateUser.isPending ? 'Updating...' : 'Update Name'}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}