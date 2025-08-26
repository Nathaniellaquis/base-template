import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps, View, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useThemedStyles } from '@/styles';
import { createButtonStyles } from './index.styles';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  icon,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const styles = useThemedStyles(createButtonStyles);

  const buttonStyles = [
    styles.button,
    size === 'small' && styles.buttonSmall,
    size === 'large' && styles.buttonLarge,
    variant === 'primary' && styles.buttonPrimary,
    variant === 'secondary' && styles.buttonSecondary,
    variant === 'danger' && styles.buttonDanger,
    variant === 'outline' && styles.buttonOutline,
    (disabled || loading) && styles.buttonDisabled,
  ];

  const textStyles = [
    styles.buttonText,
    size === 'small' && styles.buttonTextSmall,
    variant === 'secondary' && styles.buttonTextSecondary,
    variant === 'outline' && styles.buttonTextOutline,
  ];

  const getLoadingColor = () => {
    if (variant === 'primary' || variant === 'danger') return '#FFFFFF';
    return styles.buttonTextSecondary.color;
  };

  return (
    <TouchableOpacity
      style={StyleSheet.flatten([...buttonStyles, style]) as StyleProp<ViewStyle>}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={getLoadingColor()} 
        />
      ) : (
        <View style={styles.row}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={StyleSheet.flatten(textStyles) as StyleProp<TextStyle>}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}