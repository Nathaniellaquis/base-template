import React, { ReactNode } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useThemedStyles } from '@/styles';
import { createAuthLayoutStyles } from './index.styles';

interface AuthFormLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  bottomLinks?: {
    text: string;
    linkText: string;
    href: string;
  }[];
}

export function AuthFormLayout({
  title,
  subtitle,
  children,
  bottomLinks = [],
}: AuthFormLayoutProps) {
  const styles = useThemedStyles(createAuthLayoutStyles);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>

            <View style={styles.form}>{children}</View>

            {bottomLinks.map((link, index) => (
              <View key={index} style={styles.linkContainer}>
                <Text style={styles.linkText}>{link.text}</Text>
                <Link href={link.href as any} asChild>
                  <TouchableOpacity>
                    <Text style={styles.link}>{link.linkText}</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}