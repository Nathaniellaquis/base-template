import React from 'react';
import { View } from 'react-native';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export function Card({ children, className = '' }: CardProps) {
    return (
        <View className={`bg-white p-4 rounded-lg shadow ${className}`}>
            {children}
        </View>
    );
} 