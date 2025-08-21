/**
 * Authentication Recovery Utility
 * Handles cases where tokens become invalid due to server restarts, key changes, etc.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys used by the app
const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  REFRESH_TOKEN: 'refreshToken', 
  USER_DATA: 'userData',
  ENCRYPTED_TOKENS: 'encryptedTokens',
  CREDENTIALS: 'credentials'
};

/**
 * Clear all authentication data from storage
 */
export const clearAuthenticationState = async (): Promise<void> => {
  try {
    console.log('🧹 Clearing authentication state...');
    
    // Remove all auth-related storage items
    const keysToRemove = Object.values(STORAGE_KEYS);
    await AsyncStorage.multiRemove(keysToRemove);
    
    console.log('✅ Authentication state cleared successfully');
    console.log('🔄 App should redirect to login screen');
  } catch (error) {
    console.error('❌ Error clearing authentication state:', error);
    throw error;
  }
};

/**
 * Check if current tokens are valid by testing with server
 */
export const validateStoredTokens = async (apiBaseUrl: string): Promise<boolean> => {
  try {
    console.log('🔍 Validating stored tokens...');
    
    // Get stored token
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      console.log('❌ No stored token found');
      return false;
    }
    
    // Test token with server
    const response = await fetch(`${apiBaseUrl}/auth/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ Stored tokens are valid');
      return true;
    } else {
      console.log('❌ Stored tokens are invalid, status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Error validating tokens:', error);
    return false;
  }
};

/**
 * Debug token information
 */
export const debugStoredToken = async (apiBaseUrl: string): Promise<any> => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      return { error: 'No token stored' };
    }
    
    // Call debug endpoint
    const response = await fetch(`${apiBaseUrl}/auth/debug-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const debugInfo = await response.json();
    console.log('🔍 Token debug info:', debugInfo);
    return debugInfo;
  } catch (error) {
    console.error('❌ Error debugging token:', error);
    return { error: error.message };
  }
};

/**
 * Force logout and clear state
 */
export const forceLogout = async (apiBaseUrl: string): Promise<void> => {
  try {
    console.log('🚪 Forcing logout...');
    
    // Call logout endpoint
    try {
      await fetch(`${apiBaseUrl}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.log('⚠️ Logout API call failed, proceeding with local cleanup');
    }
    
    // Clear local storage
    await clearAuthenticationState();
    
    console.log('✅ Force logout completed');
  } catch (error) {
    console.error('❌ Error during force logout:', error);
    throw error;
  }
};

/**
 * Recovery function to handle invalid token errors
 */
export const handleAuthenticationRecovery = async (
  apiBaseUrl: string,
  onRecoveryComplete?: () => void
): Promise<void> => {
  try {
    console.log('🔄 Starting authentication recovery...');
    
    // Step 1: Debug current token
    const debugInfo = await debugStoredToken(apiBaseUrl);
    console.log('🔍 Current token debug:', debugInfo);
    
    // Step 2: Clear authentication state
    await clearAuthenticationState();
    
    // Step 3: Notify completion
    if (onRecoveryComplete) {
      onRecoveryComplete();
    }
    
    console.log('✅ Authentication recovery completed');
  } catch (error) {
    console.error('❌ Error during authentication recovery:', error);
    throw error;
  }
};

export default {
  clearAuthenticationState,
  validateStoredTokens,
  debugStoredToken,
  forceLogout,
  handleAuthenticationRecovery
};
