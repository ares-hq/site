import { useDarkMode } from '@/context/DarkModeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface ErrorStateProps {
  error: string | null;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  const { isDarkMode } = useDarkMode();

  return (
    <View style={styles.errorContainer}>
      <Ionicons
        name="alert-circle-outline"
        size={48}
        color={isDarkMode ? '#EF4444' : '#DC2626'}
      />
      <Text style={[
        styles.errorTitle,
        { color: isDarkMode ? '#F9FAFB' : '#111827' }
      ]}>
        Something went wrong
      </Text>
      <Text style={[
        styles.errorMessage,
        { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
      ]}>
        {error || 'An unknown error occurred'}
      </Text>
      <TouchableOpacity
        style={[
          styles.retryButton,
          { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }
        ]}
        onPress={onRetry}
        activeOpacity={0.7}
      >
        <Ionicons
          name="refresh"
          size={16}
          color={isDarkMode ? '#F9FAFB' : '#111827'}
        />
        <Text style={[
          styles.retryText,
          { color: isDarkMode ? '#F9FAFB' : '#111827' }
        ]}>
          Try Again
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '500',
  },
});