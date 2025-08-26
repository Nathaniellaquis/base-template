import React from 'react';
import { ResponsiveModal } from '@/components/common';
import { NotificationsList } from '../NotificationsList';

interface NotificationsOverlayProps {
  visible: boolean;
  onClose: () => void;
}

export function NotificationsOverlay({ visible, onClose }: NotificationsOverlayProps) {
  return (
    <ResponsiveModal
      visible={visible}
      onClose={onClose}
      title="Notifications"
      testID="notifications-overlay"
    >
      <NotificationsList />
    </ResponsiveModal>
  );
}