import React, { useState, useEffect } from 'react';
import { ScrollView, View, Alert, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { useThemedStyles } from '@/styles';
import { Card, Text, Button, Input } from '@/components/ui';
import { trpc } from '@/lib';

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
  },
  card: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  picker: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  recentSection: {
    marginTop: theme.spacing.xl,
  },
  notificationItem: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primary + '20',
  },
  badgeText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

export default function AdminNotifications() {
  const styles = useThemedStyles(createStyles);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<'updates' | 'reminders' | 'social'>('updates');
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  
  // Get users for dropdown
  const { data: usersData } = trpc.admin.getAllUsers.useQuery({ limit: 100 });
  
  // Get recent notifications
  const { data: notificationsData, refetch } = trpc.admin.getAllNotifications.useQuery({ 
    limit: 10 
  });
  
  // Send notification mutation
  const sendNotification = trpc.admin.sendTestNotification.useMutation();
  
  // Handle mutation errors
  useEffect(() => {
    if (sendNotification.isSuccess) {
      Alert.alert('Success', 'Notification sent successfully');
      setTitle('');
      setBody('');
      refetch();
    }
    if (sendNotification.isError) {
      Alert.alert('Error', sendNotification.error?.message || 'Failed to send notification');
    }
  }, [sendNotification.isSuccess, sendNotification.isError, sendNotification.error?.message, refetch]);
  
  const handleSend = () => {
    if (!selectedUserId) {
      Alert.alert('Error', 'Please select a user');
      return;
    }
    if (!title || !body) {
      Alert.alert('Error', 'Please enter title and body');
      return;
    }
    
    sendNotification.mutate({
      userId: selectedUserId,
      title,
      body,
      category,
    });
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Send Notification Form */}
        <Card style={styles.card}>
          <Text variant="h3" style={{ marginBottom: 16 }}>
            Send Test Notification
          </Text>
          
          <Text style={styles.label}>Select User</Text>
          <TouchableOpacity 
            style={styles.picker}
            onPress={() => setUserModalVisible(true)}
          >
            <Text style={{ padding: 12 }}>
              {selectedUserId 
                ? usersData?.users.find((u: any) => (u._id?.toString() || u.uid) === selectedUserId)?.email || 'Select a user...'
                : 'Select a user...'}
            </Text>
          </TouchableOpacity>
          
          {/* User Selection Modal */}
          <Modal
            visible={userModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setUserModalVisible(false)}
          >
            <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <View style={{ backgroundColor: 'white', maxHeight: '70%', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
                <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Select User</Text>
                </View>
                <FlatList
                  data={usersData?.users || []}
                  keyExtractor={(item) => item._id?.toString() || item.uid || ''}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}
                      onPress={() => {
                        setSelectedUserId(item._id?.toString() || item.uid || '');
                        setUserModalVisible(false);
                      }}
                    >
                      <Text>{item.email} {item.displayName ? `(${item.displayName})` : ''}</Text>
                    </TouchableOpacity>
                  )}
                />
                <TouchableOpacity
                  style={{ padding: 16, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#e0e0e0' }}
                  onPress={() => setUserModalVisible(false)}
                >
                  <Text style={{ color: '#007AFF', fontSize: 16 }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          
          <Text style={styles.label}>Category</Text>
          <TouchableOpacity 
            style={styles.picker}
            onPress={() => setCategoryModalVisible(true)}
          >
            <Text style={{ padding: 12, textTransform: 'capitalize' }}>{category}</Text>
          </TouchableOpacity>
          
          {/* Category Selection Modal */}
          <Modal
            visible={categoryModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setCategoryModalVisible(false)}
          >
            <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <View style={{ backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
                <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Select Category</Text>
                </View>
                {['updates', 'reminders', 'social'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}
                    onPress={() => {
                      setCategory(cat as 'updates' | 'reminders' | 'social');
                      setCategoryModalVisible(false);
                    }}
                  >
                    <Text style={{ textTransform: 'capitalize' }}>{cat}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={{ padding: 16, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#e0e0e0' }}
                  onPress={() => setCategoryModalVisible(false)}
                >
                  <Text style={{ color: '#007AFF', fontSize: 16 }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          
          <Input
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="Notification title"
            containerStyle={styles.inputContainer}
          />
          
          <Input
            label="Body"
            value={body}
            onChangeText={setBody}
            placeholder="Notification message"
            multiline
            numberOfLines={3}
            containerStyle={styles.inputContainer}
          />
          
          <Button
            title="Send Notification"
            onPress={handleSend}
            loading={sendNotification.isPending}
            disabled={sendNotification.isPending}
          />
        </Card>
        
        {/* Recent Notifications */}
        <View style={styles.recentSection}>
          <Text variant="h3" style={{ marginBottom: 16 }}>
            Recent Notifications
          </Text>
          
          {notificationsData?.notifications.map((notif: any) => (
            <Card key={notif._id?.toString() || notif._id} style={styles.notificationItem}>
              <View style={styles.notificationHeader}>
                <Text variant="bodySmall" style={{ fontWeight: '600' }}>{notif.title}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{notif.status || 'sent'}</Text>
                </View>
              </View>
              <Text variant="body" numberOfLines={2}>{notif.body}</Text>
              <Text variant="caption" style={{ marginTop: 8 }}>
                To: {notif.userEmail || 'Unknown'} - {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : 'Unknown'}
              </Text>
            </Card>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}