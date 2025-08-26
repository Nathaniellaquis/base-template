import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet, StyleProp, TextStyle } from 'react-native';
import { useThemedStyles } from '@/styles';
import { createTextStyles } from './index.styles';

interface TextProps extends RNTextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'bodySmall' | 'caption' | 'link';
  children: React.ReactNode;
}

export function Text({ 
  variant = 'body', 
  style, 
  children,
  ...props 
}: TextProps) {
  const styles = useThemedStyles(createTextStyles);

  const textStyles = {
    h1: styles.h1,
    h2: styles.h2,
    h3: styles.h3,
    h4: styles.h4,
    body: styles.body,
    bodySmall: styles.bodySmall,
    caption: styles.caption,
    link: styles.link,
  };

  return (
    <RNText style={StyleSheet.flatten([textStyles[variant], style]) as StyleProp<TextStyle>} {...props}>
      {children}
    </RNText>
  );
}