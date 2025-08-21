import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/authService';

/**
 * Helper utility to check and fix authentication state issues
 */
export class AuthHelper {
  
  /**
   * Check if user has valid authentication
   */
  static async checkAuthState(): Promise<{
    hasToken: boolean;
    hasUserData: boolean;
    isValid: boolean;
    needsLogin: boolean;
  }> {
    try {
      // Check for stored tokens
      const token = await authService.getTokenAsync();
      const userData = await AsyncStorage.getItem('userData');
      
      const hasToken = !!token;
      const hasUserData = !!userData;
      
      let isValid = false;
      if (hasToken) {
        try {
          // Test token validity
          isValid = await authService.verifyToken();
        } catch (error) {
          console.log('Token validation failed:', error.message);
          isValid = false;
        }
      }
      
      const needsLogin = !hasToken || !hasUserData || !isValid;
      
      console.log('Auth State Check:', {
        hasToken,
        hasUserData, 
        isValid,
        needsLogin
      });
      
      return {
        hasToken,
        hasUserData,
        isValid,
        needsLogin
      };
    } catch (error) {
      console.error('Auth state check failed:', error);
      return {
        hasToken: false,
        hasUserData: false,
        isValid: false,
        needsLogin: true
      };
    }
  }
  
  /**
   * Clear all authentication data and reset to fresh state
   */
  static async clearAuthState(): Promise<boolean> {
    try {
      console.log('🧹 Clearing all authentication state...');
      
      // Clear authService state
      await authService.forceResetAuth();
      
      // Clear Redux persist data
      await AsyncStorage.removeItem('persist:root');
      
      console.log('✅ Authentication state cleared');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear auth state:', error);
      return false;
    }
  }
  
  /**
   * Debug current authentication state
   */
  static async debugAuthState(): Promise<void> {
    console.log('\n=== AUTH HELPER DEBUG ===');
    
    try {
      const authState = await this.checkAuthState();
      console.log('Auth State:', authState);
      
      // Check all storage keys
      const keys = await AsyncStorage.getAllKeys();
      const authKeys = keys.filter(key => 
        key.includes('auth') || 
        key.includes('user') || 
        key.includes('token')
      );
      
      console.log('Auth-related storage keys:', authKeys);
      
      // Check authService internal state
      await authService.debugAuthState();
      
    } catch (error) {
      console.error('Auth debug failed:', error);
    }
    
    console.log('=== END AUTH DEBUG ===\n');
  }
  
  /**
   * Force a clean login state
   */
  static async forceCleanState(): Promise<boolean> {
    try {
      console.log('🔄 Forcing clean authentication state...');
      
      // 1. Clear all auth data
      await this.clearAuthState();
      
      // 2. Initialize authService fresh
      await authService.initialize();
      
      console.log('✅ Clean state ready - user can now log in');
      return true;
    } catch (error) {
      console.error('❌ Failed to force clean state:', error);
      return false;
    }
  }
  
  /**
   * Test login with default credentials (for development)
   */
  static async testLogin(): Promise<{success: boolean, message: string}> {
    try {
      console.log('🧪 Testing login with default credentials...');
      
      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123'
      });
      
      if (result.success) {
        console.log('✅ Test login successful');
        return { success: true, message: 'Test login successful' };
      } else {
        console.log('❌ Test login failed:', result.message);
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('❌ Test login error:', error);
      return { success: false, message: error.message || 'Test login failed' };
    }
  }
}

export default AuthHelper;
