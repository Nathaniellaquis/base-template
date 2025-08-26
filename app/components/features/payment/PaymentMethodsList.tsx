import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { useThemedStyles } from '@/styles';
import { Theme } from '@/types/theme';
import { Ionicons } from '@expo/vector-icons';
import type { PaymentMethod } from '@shared';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

interface PaymentMethodsListProps {
  methods: PaymentMethod[];
  onAddMethod: () => void;
  onSetDefault: (methodId: string) => Promise<void>;
  onRemoveMethod: (methodId: string) => Promise<void>;
  isLoading?: boolean;
  onRefresh?: () => Promise<void>;
}

export function PaymentMethodsList({
  methods,
  onAddMethod,
  onSetDefault,
  onRemoveMethod,
  isLoading = false,
  onRefresh,
}: PaymentMethodsListProps) {
  const styles = useThemedStyles(createStyles);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleSetDefault = async (methodId: string) => {
    try {
      setProcessingId(methodId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await onSetDefault(methodId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Error', 'Failed to update default payment method');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemove = (method: PaymentMethod) => {
    const methodName = getMethodDisplayName(method);

    Alert.alert(
      'Remove Payment Method',
      `Are you sure you want to remove ${methodName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingId(method.id);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await onRemoveMethod(method.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {
              Alert.alert('Error', 'Failed to remove payment method');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
  };

  const getMethodDisplayName = (method: PaymentMethod): string => {
    switch (method.type) {
      case 'card':
        return `${method.brand} •••• ${method.last4}`;
      case 'apple_pay':
        return 'Apple Pay';
      case 'google_pay':
        return 'Google Pay';
      default:
        return 'Payment Method';
    }
  };

  const getMethodIcon = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'card':
        return 'card';
      case 'apple_pay':
        return 'logo-apple';
      case 'google_pay':
        return 'logo-google';
      default:
        return 'card';
    }
  };

  const getBrandColor = (brand?: string): string => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return '#1A1F71';
      case 'mastercard':
        return '#EB001B';
      case 'amex':
        return '#006FCF';
      case 'discover':
        return '#FF6000';
      default:
        return '#6B7280';
    }
  };

  if (methods.length === 0 && !isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="card-outline" size={64} color="#E5E7EB" />
        <Text style={styles.emptyTitle}>No payment methods</Text>
        <Text style={styles.emptyText}>
          Add a payment method to subscribe to premium plans
        </Text>
        <Button
          title="Add Payment Method"
          onPress={onAddMethod}
          style={styles.addButton}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        ) : undefined
      }
    >
      <View style={styles.listContainer}>
        {methods.map((method) => (
          <Card key={method.id} style={styles.methodCard}>
            <TouchableOpacity
              style={styles.methodContent}
              onPress={() => !method.isDefault && handleSetDefault(method.id)}
              disabled={method.isDefault || processingId === method.id}
              activeOpacity={0.7}
            >
              <View style={styles.methodLeft}>
                <View
                  style={[
                    styles.iconContainer,
                    method.type === 'card' && {
                      backgroundColor: getBrandColor(method.brand)
                    }
                  ]}
                >
                  <Ionicons
                    name={getMethodIcon(method.type) as any}
                    size={20}
                    color="white"
                  />
                </View>

                <View style={styles.methodInfo}>
                  <Text style={styles.methodName}>
                    {getMethodDisplayName(method)}
                  </Text>
                  {method.type === 'card' && method.expiryMonth && (
                    <Text style={styles.methodExpiry}>
                      Expires {method.expiryMonth.toString().padStart(2, '0')}/
                      {method.expiryYear?.toString().slice(-2)}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.methodRight}>
                {method.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Default</Text>
                  </View>
                )}

                {!method.isDefault && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemove(method)}
                    disabled={processingId === method.id}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>

            {processingId === method.id && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator size="small" color="#6366F1" />
              </View>
            )}
          </Card>
        ))}
      </View>

      <View style={styles.addSection}>
        <Button
          title="Add New Payment Method"
          variant="secondary"
          onPress={onAddMethod}
          icon={<Ionicons name="add" size={20} color="#6366F1" />}
        />
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoItem}>
          <Ionicons name="shield-checkmark" size={16} color="#10B981" />
          <Text style={styles.infoText}>
            Your payment information is encrypted and secure
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="information-circle" size={16} color="#6B7280" />
          <Text style={styles.infoText}>
            You can update your billing address in the Stripe portal
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContainer: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  methodCard: {
    padding: 0,
    marginBottom: theme.spacing.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  methodContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.gray[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: {
    gap: 2,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  methodExpiry: {
    fontSize: 13,
    color: theme.colors.gray[500],
  },
  methodRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  defaultBadge: {
    backgroundColor: '#D1FAE5', // Light green background
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  defaultText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.success,
  },
  removeButton: {
    padding: theme.spacing.sm,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  infoSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  infoText: {
    fontSize: 12,
    color: theme.colors.gray[600],
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.gray[600],
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  addButton: {
    minWidth: 200,
  },
});