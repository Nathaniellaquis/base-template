import React, { useState } from 'react';
import { TextInput, View, Text, TextInputProps, ViewStyle, NativeSyntheticEvent, TextInputFocusEventData, StyleSheet, StyleProp, TextStyle } from 'react-native';
import { useThemedStyles } from '@/styles';
import { createInputStyles } from './index.styles';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  helperText,
  containerStyle,
  onFocus,
  onBlur,
  editable = true,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const styles = useThemedStyles(createInputStyles);

  const handleFocus = (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  const inputStyles = [
    styles.input,
    isFocused && styles.inputFocused,
    error && styles.inputError,
    !editable && styles.inputDisabled,
  ].filter(Boolean);

  return (
    <View style={containerStyle}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={StyleSheet.flatten(inputStyles) as StyleProp<TextStyle>}
        placeholderTextColor={styles.helperText.color}
        onFocus={handleFocus}
        onBlur={handleBlur}
        editable={editable}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
      {helperText && !error && <Text style={styles.helperText}>{helperText}</Text>}
    </View>
  );
}