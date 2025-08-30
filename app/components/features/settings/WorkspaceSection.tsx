import React, { useState } from 'react';
import { View, Alert, Modal, TextInput } from 'react-native';
import { Button, Card, Text } from '@/components/ui';
import { useWorkspace } from '@/providers/workspace';
import { useThemedStyles } from '@/styles';
import { createWorkspaceSectionStyles } from './WorkspaceSection.styles';

export function WorkspaceSection() {
  const workspace = useWorkspace();
  const styles = useThemedStyles(createWorkspaceSectionStyles);
  const [showPicker, setShowPicker] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Return null if workspaces are disabled
  if (!workspace) {
    return null;
  }

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      Alert.alert('Error', 'Workspace name cannot be empty');
      return;
    }

    setIsCreating(true);
    try {
      await workspace.createWorkspace(newWorkspaceName.trim());
      setShowCreateModal(false);
      setNewWorkspaceName('');
      Alert.alert('Success', 'Workspace created successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to create workspace');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSwitchWorkspace = async (workspaceId: string) => {
    if (workspaceId === workspace.currentWorkspace?._id) {
      setShowPicker(false);
      return;
    }

    try {
      await workspace.switchWorkspace(workspaceId);
      setShowPicker(false);
      Alert.alert('Success', 'Workspace switched successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to switch workspace');
    }
  };

  return (
    <>
      <Card style={styles.section}>
        <Text variant="h3" style={styles.sectionTitle}>
          Workspace
        </Text>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Current Workspace</Text>
          <View style={styles.workspaceRow}>
            <Text variant="body" style={styles.workspaceName}>
              {workspace.currentWorkspace?.name || 'No workspace'}
            </Text>
            {workspace.workspaces.length > 1 && (
              <Button
                title="Switch"
                size="small"
                variant="secondary"
                onPress={() => setShowPicker(true)}
              />
            )}
          </View>
        </View>

        <Button
          title="Create New Workspace"
          variant="secondary"
          onPress={() => setShowCreateModal(true)}
          style={styles.createButton}
        />

        {workspace.currentWorkspace && (
          <View style={styles.memberInfo}>
            <Text variant="bodySmall" style={styles.memberCount}>
              {workspace.currentWorkspace.members.length} member{workspace.currentWorkspace.members.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </Card>

      {/* Workspace Picker Modal */}
      <Modal
        visible={showPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="h3" style={styles.modalTitle}>
              Select Workspace
            </Text>
            
            {workspace.workspaces.map((ws) => (
              <Button
                key={ws._id}
                title={ws.name}
                variant={ws._id === workspace.currentWorkspace?._id ? 'primary' : 'secondary'}
                onPress={() => handleSwitchWorkspace(ws._id)}
                style={styles.workspaceOption}
              />
            ))}
            
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setShowPicker(false)}
              style={styles.cancelButton}
            />
          </View>
        </View>
      </Modal>

      {/* Create Workspace Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="h3" style={styles.modalTitle}>
              Create Workspace
            </Text>
            
            <TextInput
              value={newWorkspaceName}
              onChangeText={setNewWorkspaceName}
              placeholder="Workspace name"
              style={styles.input}
              maxLength={50}
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <Button
                title="Create"
                variant="primary"
                onPress={handleCreateWorkspace}
                loading={isCreating}
                disabled={isCreating || !newWorkspaceName.trim()}
                style={styles.modalButton}
              />
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => {
                  setShowCreateModal(false);
                  setNewWorkspaceName('');
                }}
                disabled={isCreating}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}