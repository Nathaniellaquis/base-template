import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import type { ResponsiveModalProps } from './index';

export default function DesktopModal({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  closeOnBackdrop = true,
  testID,
}: ResponsiveModalProps) {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.9)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Fade in overlay
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Scale and fade in modal
      Animated.parallel([
        Animated.spring(modalScale, {
          toValue: 1,
          damping: 20,
          stiffness: 300,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Fade out overlay
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();

      // Scale down and fade out modal
      Animated.parallel([
        Animated.timing(modalScale, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, overlayOpacity, modalScale, modalOpacity]);

  const handleBackdropPress = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      testID={testID}
    >
      <View style={styles.desktopContainer}>
        {/* Overlay */}
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: overlayOpacity,
            },
          ]}
        >
          <TouchableWithoutFeedback onPress={handleBackdropPress}>
            <View style={styles.overlayTouchable} />
          </TouchableWithoutFeedback>
        </Animated.View>

        {/* Modal content */}
        <Animated.View
          style={[
            styles.desktopModalContent,
            {
              opacity: modalOpacity,
              transform: [{ scale: modalScale }],
            },
          ]}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <View style={styles.desktopHeader}>
              {title && <Text style={styles.desktopTitle}>{title}</Text>}
              {showCloseButton && (
                <TouchableOpacity
                  style={styles.desktopCloseButton}
                  onPress={onClose}
                  testID={`${testID}-close-button`}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Content */}
          <View style={styles.desktopContent}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}