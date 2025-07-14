import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

interface ButtonProps {
    onPress: () => void;
    children: React.ReactNode;
    className?: string;
}

export function Button({ onPress, children, className = '' }: ButtonProps) {
    return (
        <TouchableOpacity
            onPress={onPress}
            className={`bg-blue-500 px-4 py-2 rounded ${className}`}
        >
            <Text className="text-white font-semibold">{children}</Text>
        </TouchableOpacity>
    );
} 