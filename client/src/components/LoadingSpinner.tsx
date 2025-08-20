import React from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/theme';
import { loadingSpinnerStyles as styles } from './LoadingSpinner.styles';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  children?: React.ReactNode;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'लोड हुँदैछ...', 
  size = 'large',
  isLoading = false,
  error = null,
  onRetry,
  children
}) => {
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        {onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }
  
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size={size} color={COLORS.primary} />
        {message && (
          <Text style={styles.message}>{message}</Text>
        )}
      </View>
    );
  }
  
  return <>{children}</>;
};

export default LoadingSpinner;

