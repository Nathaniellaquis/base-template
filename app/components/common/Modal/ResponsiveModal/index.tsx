import React from 'react';
import { View } from 'react-native';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import MobileModal from './MobileModal';
import DesktopModal from './DesktopModal';

export interface ResponsiveModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  testID?: string;
}

export default function ResponsiveModal(props: ResponsiveModalProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (isDesktop) {
    return <DesktopModal {...props} />;
  }

  return <MobileModal {...props} />;
}