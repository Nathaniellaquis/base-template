import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import type { ResponsiveModalProps } from './index';

const { height: screenHeight } = Dimensions.get('window');

export default function MobileModal({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  closeOnBackdrop = true,
  testID,
}: ResponsiveModalProps) {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(screenHeight)).current;

  useEffect(() => {
    if (visible) {
      // Fade in overlay instantly
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Slide up modal content
      Animated.spring(modalTranslateY, {
        toValue: 0,
        damping: 20,
        stiffness: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Fade out overlay
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();

      // Slide down modal content
      Animated.timing(modalTranslateY, {
        toValue: screenHeight,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, overlayOpacity, modalTranslateY]);

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
      <View style={styles.container}>
        {/* Overlay with independent fade animation */}
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

        {/* Modal content with slide animation */}
        <Animated.View
          style={[
            styles.mobileModalContent,
            {
              transform: [{ translateY: modalTranslateY }],
            },
          ]}
        >
          <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            {(title || showCloseButton) && (
              <View style={styles.header}>
                {showCloseButton && (
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={onClose}
                    testID={`${testID}-close-button`}
                  >
                    <Ionicons
                      name={Platform.OS === 'ios' ? 'chevron-down' : 'arrow-back'}
                      size={24}
                      color="#333"
                    />
                  </TouchableOpacity>
                )}
                {title && <Text style={styles.title}>{title}</Text>}
                {/* Spacer for layout balance */}
                {showCloseButton && <View style={styles.headerSpacer} />}
              </View>
            )}

            {/* Content */}
            <View style={styles.content}>{children}</View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}