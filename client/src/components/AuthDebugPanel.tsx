/**
 * Authentication Debug Panel
 * Shows authentication status and provides recovery options
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../store';
import { logout } from '../store/slices/authSlice';
import authRecovery from '../utils/authRecovery';
import apiClient from '../services/api';

interface AuthDebugPanelProps {
  visible?: boolean;
  onClose?: () => void;
}

export const AuthDebugPanel: React.FC<AuthDebugPanelProps> = ({ 
  visible = false, 
  onClose 
}) => {
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();

  const handleClearAuth = async () => {
    try {
      setLoading(true);
      
      Alert.alert(
        'Clear Authentication',
        'This will log you out and clear all stored authentication data. You will need to log in again.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear',
            style: 'destructive',
            onPress: async () => {
              try {
                await authRecovery.clearAuthenticationState();
                dispatch(logout());
                
                Alert.alert(
                  'Success',
                  'Authentication state cleared. Please log in again.',
                  [{ text: 'OK', onPress: onClose }]
                );
              } catch (error) {
                Alert.alert('Error', 'Failed to clear authentication state');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error clearing auth:', error);
      Alert.alert('Error', 'Failed to clear authentication state');
    } finally {
      setLoading(false);
    }
  };

  const handleDebugToken = async () => {
    try {
      setLoading(true);
      const baseUrl = apiClient.defaults.baseURL?.replace('/api', '') || 'http://localhost:3000';
      const info = await authRecovery.debugStoredToken(baseUrl + '/api');
      setDebugInfo(info);
    } catch (error) {
      console.error('Error debugging token:', error);
      Alert.alert('Error', 'Failed to debug token');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateTokens = async () => {
    try {
      setLoading(true);
      const baseUrl = apiClient.defaults.baseURL?.replace('/api', '') || 'http://localhost:3000';
      const isValid = await authRecovery.validateStoredTokens(baseUrl + '/api');
      
      Alert.alert(
        'Token Validation',
        isValid ? 'Tokens are valid' : 'Tokens are invalid',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error validating tokens:', error);
      Alert.alert('Error', 'Failed to validate tokens');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        <ScrollView>
          <Text style={styles.title}>Authentication Debug Panel</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Status</Text>
            <Text style={styles.info}>Authenticated: {isAuthenticated ? '✅ Yes' : '❌ No'}</Text>
            <Text style={styles.info}>User ID: {user?.id || 'None'}</Text>
            <Text style={styles.info}>Email: {user?.email || 'None'}</Text>
          </View>

          {debugInfo && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Token Debug Info</Text>
              <ScrollView style={styles.debugScroll}>
                <Text style={styles.debugText}>
                  {JSON.stringify(debugInfo, null, 2)}
                </Text>
              </ScrollView>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.debugButton]} 
              onPress={handleDebugToken}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Debug Token</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.validateButton]} 
              onPress={handleValidateTokens}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Validate Token</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.clearButton]} 
              onPress={handleClearAuth}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Clear Auth State</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.closeButton]} 
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  panel: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#555',
  },
  info: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
    fontFamily: 'monospace',
  },
  debugScroll: {
    maxHeight: 200,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
  },
  buttonContainer: {
    gap: 10,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  debugButton: {
    backgroundColor: '#2196F3',
  },
  validateButton: {
    backgroundColor: '#4CAF50',
  },
  clearButton: {
    backgroundColor: '#f44336',
  },
  closeButton: {
    backgroundColor: '#757575',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AuthDebugPanel;
