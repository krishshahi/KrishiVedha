import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { COLORS } from '../constants/theme';
import { styles } from '../styles/LoadingSpinner.styles';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'लोड हुँदैछ...', 
  size = 'large' 
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={COLORS.primary} />
      {message && (
        <Text style={styles.message}>{message}</Text>
      )}
    </View>
  );
};


export default LoadingSpinner;

