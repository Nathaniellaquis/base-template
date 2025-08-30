import { OnboardingLayout } from '@/components/features';
import { Text } from '@/components/ui';
import { useOnboardingNavigation } from '@/hooks/useOnboardingNavigation';
import { trpc } from '@/lib/api/trpc';
import { useAuth } from '@/providers/auth';
import { useTheme } from '@/providers/theme';
import { useThemedStyles } from '@/styles';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { createStyles } from './index.styles';

type Mode = 'choose' | 'create' | 'join';

export default function WorkspaceSelection() {
  const [mode, setMode] = useState<Mode>('choose');
  const [workspaceName, setWorkspaceName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { completeAndNavigate } = useOnboardingNavigation();
  const { refreshUser } = useAuth();
  const utils = trpc.useContext();
  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();

  // Mutations
  const createWorkspace = trpc.workspace.create.useMutation({
    onSuccess: async () => {
      // Invalidate workspace list to ensure it includes the new workspace
      await utils.workspace.list.invalidate();
      // Refresh user data to get updated currentWorkspaceId
      await refreshUser();
    }
  });

  const joinWorkspace = trpc.workspace.joinWithInvite.useMutation({
    onSuccess: async () => {
      // Invalidate workspace list to ensure it includes the joined workspace
      await utils.workspace.list.invalidate();
      // Refresh user data to get updated currentWorkspaceId
      await refreshUser();
    }
  });

  const validateInvite = trpc.workspace.validateInvite.useQuery(
    { code: inviteCode },
    {
      enabled: false, // Manual trigger
    }
  );

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) {
      Alert.alert('Error', 'Please enter a workspace name');
      return;
    }

    setIsLoading(true);
    try {
      await createWorkspace.mutateAsync({ name: workspaceName.trim() });
      await completeAndNavigate();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create workspace');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinWorkspace = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    setIsLoading(true);
    try {
      // Validate first
      const validation = await validateInvite.refetch();
      if (validation.error) {
        throw new Error(validation.error.message);
      }

      // Join workspace
      await joinWorkspace.mutateAsync({ code: inviteCode.trim() });
      await completeAndNavigate();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to join workspace');
    } finally {
      setIsLoading(false);
    }
  };

  const formatInviteCode = (text: string) => {
    // Keep only digits
    return text.replace(/\D/g, '').slice(0, 4);
  };

  if (mode === 'choose') {
    return (
      <OnboardingLayout
        hideButton
        onButtonPress={() => { }}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Hop In Your Workspace</Text>
          <Text style={styles.subtitle}>All your data is organized in workspaces. Let's get you set up!</Text>

          {/* Create New Workspace Option */}
          <TouchableOpacity
            onPress={() => setMode('create')}
            style={styles.choiceCard}
            activeOpacity={0.8}
          >
            <View style={styles.choiceCardHeader}>
              <View style={[styles.choiceIconContainer, styles.createIconContainer]}>
                <MaterialIcons name="add-business" size={24} color="#007AFF" />
              </View>
              <Text style={styles.choiceTitle}>
                Create New Workspace
              </Text>
            </View>
            <Text style={styles.choiceDescription}>
              Start fresh with your own workspace. Perfect for new teams or personal use.
            </Text>
          </TouchableOpacity>

          {/* Join Existing Workspace Option */}
          <TouchableOpacity
            onPress={() => setMode('join')}
            style={styles.choiceCard}
            activeOpacity={0.8}
          >
            <View style={styles.choiceCardHeader}>
              <View style={[styles.choiceIconContainer, styles.joinIconContainer]}>
                <MaterialIcons name="group-add" size={24} color="#10B981" />
              </View>
              <Text style={styles.choiceTitle}>
                Join Existing Workspace
              </Text>
            </View>
            <Text style={styles.choiceDescription}>
              Have an invite code? Join your team's workspace and start collaborating.
            </Text>
          </TouchableOpacity>
        </View>
      </OnboardingLayout>
    );
  }

  if (mode === 'create') {
    return (
      <OnboardingLayout
        buttonTitle="Create Workspace"
        onButtonPress={handleCreateWorkspace}
        isButtonLoading={isLoading}
      >
        <ScrollView 
          style={styles.formContainer} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}>
          <TouchableOpacity onPress={() => setMode('choose')} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>

          <Text style={styles.title}>Create Your Workspace</Text>
          <Text style={styles.subtitle}>Give your workspace a name. You can always change this later.</Text>

          <Text style={styles.label}>
            Workspace Name
          </Text>
          <TextInput
            value={workspaceName}
            onChangeText={setWorkspaceName}
            placeholder="My Team"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            autoCapitalize="words"
            autoFocus
          />
        </ScrollView>
      </OnboardingLayout>
    );
  }

  // Join mode
  return (
    <OnboardingLayout
      buttonTitle="Join Workspace"
      onButtonPress={handleJoinWorkspace}
      isButtonLoading={isLoading}
    >
      <ScrollView 
        style={styles.formContainer} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        <TouchableOpacity onPress={() => setMode('choose')} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <Text style={styles.title}>Join a Workspace</Text>
        <Text style={styles.subtitle}>Enter the invite code shared by your team admin</Text>

        <Text style={styles.label}>
          Invite Code
        </Text>
        <TextInput
          value={inviteCode}
          onChangeText={(text) => setInviteCode(formatInviteCode(text))}
          placeholder="1234"
          placeholderTextColor="#9CA3AF"
          style={styles.inviteCodeInput}
          keyboardType="numeric"
          autoCorrect={false}
          autoFocus
          maxLength={4}
        />

        {validateInvite.data && (
          <View style={styles.workspacePreview}>
            <Text style={styles.workspaceName}>
              {validateInvite.data.workspaceName}
            </Text>
            <Text style={styles.workspaceInfo}>
              {validateInvite.data.memberCount} member{validateInvite.data.memberCount !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        <Text style={styles.helperText}>
          Don't have an invite code? Ask your workspace admin to generate one.
        </Text>
      </ScrollView>
    </OnboardingLayout>
  );
}