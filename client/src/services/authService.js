import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import TouchID from 'react-native-touch-id';
import { apiConfig } from '../config/apiConfig';

const BASE_URL = apiConfig.baseURL;
const ENCRYPTION_KEY = 'AgriTech_2024_SecureKey';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.authToken = null;
    this.refreshToken = null;
    this.isAuthenticated = false;
    this.biometricAvailable = false;
  }

  // Initialize authentication service
  async initialize() {
    try {
      console.log('[AUTH] Initializing authentication service...');
      
      // Check biometric availability
      await this.checkBiometricAvailability();
      
      // Attempt to restore user session
      await this.restoreUserSession();
      
      console.log('[AUTH] Authentication service initialized');
      return true;
    } catch (error) {
      console.error('[AUTH] Failed to initialize:', error);
      return false;
    }
  }

  // Check if biometric authentication is available
  async checkBiometricAvailability() {
    try {
      const biometryType = await TouchID.isSupported({
        unifiedErrors: false
      });
      
      this.biometricAvailable = true;
      console.log('[AUTH] Biometric authentication available:', biometryType);
      
      await AsyncStorage.setItem('biometricAvailable', JSON.stringify({
        available: true,
        type: biometryType
      }));
    } catch (error) {
      console.log('[AUTH] Biometric authentication not available:', error.message);
      this.biometricAvailable = false;
      await AsyncStorage.setItem('biometricAvailable', JSON.stringify({
        available: false,
        type: null
      }));
    }
  }

  // Encrypt sensitive data (React Native compatible)
  encryptData(data) {
    try {
      console.log('[AUTH] 🔐 Encoding data for secure storage...');
      
      // Use base64 encoding for React Native compatibility
      // This provides basic obfuscation while avoiding crypto module issues
      const jsonString = JSON.stringify(data);
      
      // Simple XOR obfuscation + base64 for basic security
      let obfuscated = '';
      for (let i = 0; i < jsonString.length; i++) {
        const charCode = jsonString.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
        obfuscated += String.fromCharCode(charCode);
      }
      
      const base64Data = btoa(unescape(encodeURIComponent(obfuscated)));
      console.log('[AUTH] ✅ Data encoded successfully');
      return `encoded:${base64Data}`;
    } catch (error) {
      console.error('[AUTH] ❌ Encoding failed:', error);
      console.log('[AUTH] 🔄 Falling back to plain base64...');
      
      // Simple base64 fallback
      try {
        const jsonString = JSON.stringify(data);
        const base64Data = btoa(unescape(encodeURIComponent(jsonString)));
        return `base64:${base64Data}`;
      } catch (fallbackError) {
        console.error('[AUTH] ❌ Base64 fallback failed:', fallbackError);
        // Last resort: return JSON string with prefix
        console.warn('[AUTH] ⚠️ Storing data as plain JSON');
        return `plain:${JSON.stringify(data)}`;
      }
    }
  }

  // Decrypt sensitive data (React Native compatible)
  decryptData(encryptedData) {
    try {
      // Check if this is XOR obfuscated + base64 encoded data
      if (typeof encryptedData === 'string' && encryptedData.startsWith('encoded:')) {
        console.log('[AUTH] 🔓 Decoding obfuscated data...');
        const base64Data = encryptedData.substring(8); // Remove 'encoded:' prefix
        const decodedObfuscated = decodeURIComponent(escape(atob(base64Data)));
        
        // Reverse XOR obfuscation
        let original = '';
        for (let i = 0; i < decodedObfuscated.length; i++) {
          const charCode = decodedObfuscated.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
          original += String.fromCharCode(charCode);
        }
        
        const result = JSON.parse(original);
        console.log('[AUTH] ✅ Data decoded successfully');
        return result;
      }
      
      // Check if this is simple base64 data
      if (typeof encryptedData === 'string' && encryptedData.startsWith('base64:')) {
        console.log('[AUTH] 🔄 Using base64 decoding...');
        const base64Data = encryptedData.substring(7); // Remove 'base64:' prefix
        const decoded = decodeURIComponent(escape(atob(base64Data)));
        return JSON.parse(decoded);
      }
      
      // Check if this is plain data
      if (typeof encryptedData === 'string' && encryptedData.startsWith('plain:')) {
        console.log('[AUTH] ⚠️ Using plain data (no encryption)...');
        const plainData = encryptedData.substring(6); // Remove 'plain:' prefix
        return JSON.parse(plainData);
      }
      
      // Try legacy AES decryption for existing data
      try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
        const decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        console.log('[AUTH] ✅ Legacy AES data decrypted successfully');
        return decrypted;
      } catch (aesError) {
        console.warn('[AUTH] ⚠️ Legacy AES decryption failed, trying as JSON:', aesError.message);
        // Last resort: try parsing as direct JSON
        return JSON.parse(encryptedData);
      }
    } catch (error) {
      console.error('[AUTH] ❌ All decryption methods failed:', error);
      return null;
    }
  }

  // Store tokens securely
  async storeTokens(authToken, refreshToken) {
    try {
      console.log('[AUTH] 📦 Storing tokens...', { hasToken: !!authToken, hasRefresh: !!refreshToken });
      
      if (!authToken) {
        console.error('[AUTH] ❌ Cannot store null/undefined token');
        throw new Error('Token is required for storage');
      }
      
      const tokenData = {
        authToken,
        refreshToken,
        timestamp: Date.now()
      };

      // Try to encrypt and store
      try {
        const encryptedTokens = this.encryptData(tokenData);
        if (encryptedTokens) {
          await AsyncStorage.setItem('auth_tokens', encryptedTokens);
          console.log('[AUTH] ✅ Encrypted tokens stored');
        } else {
          throw new Error('Encryption returned null');
        }
      } catch (encryptError) {
        console.warn('[AUTH] ⚠️ Encryption failed, storing as JSON:', encryptError.message);
        // Fallback: store as plain JSON if encryption fails
        await AsyncStorage.setItem('auth_tokens', JSON.stringify(tokenData));
      }
      
      // Also store the token in the format expected by apiService for compatibility
      await AsyncStorage.setItem('userToken', authToken);
      
      // Handle refresh token properly
      if (refreshToken) {
        await AsyncStorage.setItem('refreshToken', refreshToken);
      } else {
        // Remove refresh token if it's null/undefined
        await AsyncStorage.removeItem('refreshToken');
      }
      
      this.authToken = authToken;
      this.refreshToken = refreshToken;
      
      console.log('[AUTH] ✅ All tokens stored successfully');
    } catch (error) {
      console.error('[AUTH] ❌ Failed to store tokens:', error);
      throw error;
    }
  }

  // Retrieve tokens
  async getStoredTokens() {
    try {
      console.log('[AUTH] 🔍 Getting stored tokens...');
      
      const storedTokens = await AsyncStorage.getItem('auth_tokens');
      if (!storedTokens) {
        console.log('[AUTH] 🔍 No auth_tokens found in storage');
        return null;
      }

      console.log('[AUTH] 🔍 Found stored tokens, attempting to parse...');
      
      let tokenData;
      try {
        // Try to decrypt first
        tokenData = this.decryptData(storedTokens);
      } catch (decryptError) {
        console.warn('[AUTH] ⚠️ Decryption failed, trying as plain JSON:', decryptError.message);
        try {
          // Fallback: try to parse as plain JSON
          tokenData = JSON.parse(storedTokens);
          console.log('[AUTH] ✅ Parsed as plain JSON');
        } catch (parseError) {
          console.error('[AUTH] ❌ Failed to parse stored tokens:', parseError);
          return null;
        }
      }
      
      if (!tokenData) {
        console.log('[AUTH] ❌ Token data is null after parsing');
        return null;
      }

      // Check if tokens are expired (7 days)
      if (tokenData.timestamp) {
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        const age = Date.now() - tokenData.timestamp;
        console.log('[AUTH] 🕐 Token age (hours):', (age / (1000 * 60 * 60)).toFixed(2));
        
        if (age > sevenDays) {
          console.log('[AUTH] ⏰ Tokens expired, clearing...');
          await this.clearStoredTokens();
          return null;
        }
      }

      console.log('[AUTH] ✅ Valid tokens retrieved from storage');
      return tokenData;
    } catch (error) {
      console.error('[AUTH] ❌ Failed to retrieve tokens:', error);
      return null;
    }
  }

  // Clear stored tokens
  async clearStoredTokens() {
    try {
      await AsyncStorage.removeItem('auth_tokens');
      await AsyncStorage.removeItem('user_data');
      await AsyncStorage.removeItem('userToken');
      this.authToken = null;
      this.refreshToken = null;
      this.currentUser = null;
      this.isAuthenticated = false;
      console.log('[AUTH] Tokens cleared');
    } catch (error) {
      console.error('[AUTH] Failed to clear tokens:', error);
    }
  }

  // Register new user
  async register(userData) {
    try {
      console.log('[AUTH] Registering new user:', userData.email);

      const response = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          password: userData.password,
          phone: userData.phone,
          farmName: userData.farmName,
          location: userData.location,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Store tokens and user data
      await this.storeTokens(data.token, data.refreshToken);
      await this.storeUserData(data.user);

      this.currentUser = data.user;
      this.authToken = data.token;
      this.refreshToken = data.refreshToken;
      this.isAuthenticated = true;

      console.log('[AUTH] User registered successfully:', data.user.email);
      return {
        success: true,
        user: data.user,
        message: 'Registration successful'
      };
    } catch (error) {
      console.error('[AUTH] Registration failed:', error);
      return {
        success: false,
        message: error.message || 'Registration failed'
      };
    }
  }

  // Login user
  async login(credentials) {
    try {
      console.log('[AUTH] Logging in user:', credentials.email);

      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          deviceInfo: {
            platform: 'react-native',
            version: '1.0.0',
            deviceId: await this.getDeviceId(),
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store tokens and user data
      await this.storeTokens(data.token, data.refreshToken);
      await this.storeUserData(data.user);

      this.currentUser = data.user;
      this.authToken = data.token;
      this.refreshToken = data.refreshToken;
      this.isAuthenticated = true;

      // Ask user if they want to enable biometric login
      if (this.biometricAvailable && !data.user.biometricEnabled) {
        setTimeout(() => {
          this.promptBiometricSetup();
        }, 1000);
      }

      console.log('[AUTH] User logged in successfully:', data.user.email);
      return {
        success: true,
        user: data.user,
        message: 'Login successful'
      };
    } catch (error) {
      console.error('[AUTH] Login failed:', error);
      return {
        success: false,
        message: error.message || 'Login failed'
      };
    }
  }

  // Biometric login
  async biometricLogin() {
    try {
      if (!this.biometricAvailable) {
        throw new Error('Biometric authentication not available');
      }

      const storedTokens = await this.getStoredTokens();
      if (!storedTokens) {
        throw new Error('No stored authentication data found');
      }

      // Request biometric authentication
      await TouchID.authenticate('Use your biometric to access AgriTech', {
        title: 'AgriTech Authentication',
        subtitle: 'Use your biometric to unlock the app',
        description: 'Place your finger on the sensor or look at the camera',
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
        unifiedErrors: false,
        passcodeFallback: true
      });

      // If biometric succeeds, restore session
      this.authToken = storedTokens.authToken;
      this.refreshToken = storedTokens.refreshToken;
      
      const userData = await this.getStoredUserData();
      if (userData) {
        this.currentUser = userData;
        this.isAuthenticated = true;

        console.log('[AUTH] Biometric login successful');
        return {
          success: true,
          user: userData,
          message: 'Biometric login successful'
        };
      } else {
        throw new Error('User data not found');
      }
    } catch (error) {
      console.error('[AUTH] Biometric login failed:', error);
      return {
        success: false,
        message: error.message || 'Biometric authentication failed'
      };
    }
  }

  // Enable biometric authentication
  async enableBiometric() {
    try {
      if (!this.biometricAvailable) {
        throw new Error('Biometric authentication not available');
      }

      // Test biometric authentication
      await TouchID.authenticate('Enable biometric login for AgriTech', {
        title: 'Enable Biometric Login',
        subtitle: 'Secure your account with biometric authentication',
        description: 'This will allow you to login quickly and securely',
        fallbackLabel: 'Cancel',
        cancelLabel: 'Cancel'
      });

      // Update user preference
      const updatedUser = { ...this.currentUser, biometricEnabled: true };
      await this.storeUserData(updatedUser);
      this.currentUser = updatedUser;

      console.log('[AUTH] Biometric authentication enabled');
      return {
        success: true,
        message: 'Biometric authentication enabled successfully'
      };
    } catch (error) {
      console.error('[AUTH] Failed to enable biometric:', error);
      return {
        success: false,
        message: error.message || 'Failed to enable biometric authentication'
      };
    }
  }

  // Store user data securely
  async storeUserData(userData) {
    try {
      console.log('[AUTH] 📦 Storing user data...');
      
      if (!userData) {
        console.log('[AUTH] 🗑️ Removing user data (null/undefined provided)');
        await AsyncStorage.removeItem('user_data');
        await AsyncStorage.removeItem('userData'); // Also remove legacy key
        this.currentUser = null;
        return;
      }
      
      try {
        const encryptedData = this.encryptData(userData);
        if (encryptedData) {
          await AsyncStorage.setItem('user_data', encryptedData);
          console.log('[AUTH] ✅ Encrypted user data stored');
        } else {
          throw new Error('Encryption returned null');
        }
      } catch (encryptError) {
        console.warn('[AUTH] ⚠️ User data encryption failed, storing as JSON:', encryptError.message);
        // Fallback: store as plain JSON
        await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      }
      
      // Also store in legacy format for compatibility
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      
      this.currentUser = userData;
      console.log('[AUTH] ✅ User data stored successfully');
    } catch (error) {
      console.error('[AUTH] ❌ Failed to store user data:', error);
      throw error;
    }
  }

  // Get stored user data
  async getStoredUserData() {
    try {
      const encryptedData = await AsyncStorage.getItem('user_data');
      if (!encryptedData) return null;

      return this.decryptData(encryptedData);
    } catch (error) {
      console.error('[AUTH] Failed to retrieve user data:', error);
      return null;
    }
  }

  // Refresh authentication token
  async refreshAuthToken() {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.refreshToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Token refresh failed');
      }

      await this.storeTokens(data.token, data.refreshToken);
      this.authToken = data.token;
      this.refreshToken = data.refreshToken;

      console.log('[AUTH] Token refreshed successfully');
      return data.token;
    } catch (error) {
      console.error('[AUTH] Token refresh failed:', error);
      await this.logout();
      throw error;
    }
  }

  // Restore user session
  async restoreUserSession() {
    try {
      console.log('[AUTH] 🔄 Starting session restoration...');
      
      const storedTokens = await this.getStoredTokens();
      const userData = await this.getStoredUserData();

      console.log('[AUTH] 📦 Stored tokens available:', !!storedTokens);
      console.log('[AUTH] 👤 User data available:', !!userData);
      
      if (storedTokens) {
        console.log('[AUTH] 🔑 Token timestamp:', new Date(storedTokens.timestamp).toISOString());
        console.log('[AUTH] 🕐 Token age (hours):', ((Date.now() - storedTokens.timestamp) / (1000 * 60 * 60)).toFixed(2));
      }
      
      if (userData) {
        console.log('[AUTH] 📧 User email:', userData.email);
      }

      if (storedTokens && userData) {
        this.authToken = storedTokens.authToken;
        this.refreshToken = storedTokens.refreshToken;
        this.currentUser = userData;
        this.isAuthenticated = true;

        // Verify token is still valid
        try {
          console.log('[AUTH] 🔍 Verifying token...');
          await this.verifyToken();
          console.log('[AUTH] ✅ Token verified successfully');
          console.log('[AUTH] 🎉 User session restored:', userData.email);
          return true;
        } catch (error) {
          console.log('[AUTH] ❌ Token verification failed:', error.message);
          console.log('[AUTH] 🔄 Attempting token refresh...');
          try {
            await this.refreshAuthToken();
            console.log('[AUTH] ✅ Token refresh successful');
            return true;
          } catch (refreshError) {
            console.log('[AUTH] ❌ Token refresh failed:', refreshError.message);
            throw refreshError;
          }
        }
      }

      console.log('[AUTH] ⚠️  No valid session data found');
      return false;
    } catch (error) {
      console.error('[AUTH] 💥 Failed to restore session:', error.message);
      console.log('[AUTH] 🧹 Clearing stored tokens due to error');
      await this.clearStoredTokens();
      return false;
    }
  }

  // Verify current token
  async verifyToken() {
    try {
      const response = await fetch(`${BASE_URL}/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Token verification failed');
      }

      return true;
    } catch (error) {
      console.error('[AUTH] Token verification failed:', error);
      throw error;
    }
  }

  // Logout user
  async logout() {
    try {
      console.log('[AUTH] Logging out user...');

      // Call logout endpoint if authenticated
      if (this.authToken) {
        try {
          await fetch(`${BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.authToken}`,
            },
          });
        } catch (error) {
          console.warn('[AUTH] Server logout failed:', error.message);
        }
      }

      // Clear local storage
      await this.clearStoredTokens();
      
      console.log('[AUTH] User logged out successfully');
      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      console.error('[AUTH] Logout failed:', error);
      return {
        success: false,
        message: 'Logout failed'
      };
    }
  }

  // Reset password
  async resetPassword(email) {
    try {
      console.log('[AUTH] Requesting password reset for:', email);

      const response = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed');
      }

      console.log('[AUTH] Password reset email sent');
      return {
        success: true,
        message: 'Password reset email sent successfully'
      };
    } catch (error) {
      console.error('[AUTH] Password reset failed:', error);
      return {
        success: false,
        message: error.message || 'Password reset failed'
      };
    }
  }

  // Update user profile
  async updateProfile(updates) {
    try {
      console.log('[AUTH] Updating user profile...');

      const response = await fetch(`${BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Profile update failed');
      }

      // Update local user data
      this.currentUser = { ...this.currentUser, ...data.user };
      await this.storeUserData(this.currentUser);

      console.log('[AUTH] Profile updated successfully');
      return {
        success: true,
        user: this.currentUser,
        message: 'Profile updated successfully'
      };
    } catch (error) {
      console.error('[AUTH] Profile update failed:', error);
      return {
        success: false,
        message: error.message || 'Profile update failed'
      };
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      console.log('[AUTH] Changing password...');

      const response = await fetch(`${BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password change failed');
      }

      console.log('[AUTH] Password changed successfully');
      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      console.error('[AUTH] Password change failed:', error);
      return {
        success: false,
        message: error.message || 'Password change failed'
      };
    }
  }

  // Get device ID
  async getDeviceId() {
    try {
      let deviceId = await AsyncStorage.getItem('device_id');
      if (!deviceId) {
        deviceId = this.generateDeviceId();
        await AsyncStorage.setItem('device_id', deviceId);
      }
      return deviceId;
    } catch (error) {
      console.error('[AUTH] Failed to get device ID:', error);
      return 'unknown_device';
    }
  }

  // Generate unique device ID
  generateDeviceId() {
    return 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Prompt biometric setup
  promptBiometricSetup() {
    // This should trigger a UI prompt in the app
    // Implementation would depend on your notification/modal system
    console.log('[AUTH] Biometric setup available - prompt user');
  }

  // Get current authentication state
  getAuthState() {
    return {
      isAuthenticated: this.isAuthenticated,
      user: this.currentUser,
      token: this.authToken,
      biometricAvailable: this.biometricAvailable,
    };
  }

  // Check if user is authenticated
  isUserAuthenticated() {
    return this.isAuthenticated && this.authToken && this.currentUser;
  }

  // Get auth header for API requests
  getAuthHeader() {
    return this.authToken ? `Bearer ${this.authToken}` : null;
  }

  // Get current auth token
  getToken() {
    return this.authToken;
  }

  // Get current auth token async (for compatibility)
  async getTokenAsync() {
    console.log('[AUTH] 🔍 getTokenAsync called');
    console.log('[AUTH] 🔍 Current authToken:', this.authToken ? this.authToken.substring(0, 20) + '...' : 'null');
    
    // First try to get current token
    if (this.authToken) {
      console.log('[AUTH] 🔍 Returning current authToken');
      return this.authToken;
    }
    
    // If no current token, try to get from storage
    try {
      console.log('[AUTH] 🔍 No current token, checking storage...');
      const storedTokens = await this.getStoredTokens();
      console.log('[AUTH] 🔍 Stored tokens:', storedTokens ? 'found' : 'not found');
      
      if (storedTokens && storedTokens.authToken) {
        console.log('[AUTH] 🔍 Setting authToken from storage:', storedTokens.authToken.substring(0, 20) + '...');
        this.authToken = storedTokens.authToken;
        return this.authToken;
      }
      
      // Also try fallback userToken format
      console.log('[AUTH] 🔍 Checking fallback userToken...');
      const fallbackToken = await AsyncStorage.getItem('userToken');
      if (fallbackToken) {
        console.log('[AUTH] 🔍 Found fallback userToken:', fallbackToken.substring(0, 20) + '...');
        this.authToken = fallbackToken;
        return this.authToken;
      }
    } catch (error) {
      console.error('[AUTH] Failed to get token from storage:', error);
    }
    
    console.log('[AUTH] 🔍 No token found anywhere, returning null');
    return null;
  }

  // Get user profile (for refreshing user data)
  async getUserProfile() {
    try {
      if (!this.authToken || !this.currentUser?.id) {
        throw new Error('No authentication token or user ID available');
      }

      const response = await fetch(`${BASE_URL}/users/${this.currentUser.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user profile');
      }

      if (data.success && data.data) {
        // Update stored user data
        const updatedUser = {
          ...this.currentUser,
          ...data.data,
          id: data.data.id || this.currentUser.id,
        };
        
        this.currentUser = updatedUser;
        await this.storeUserData(updatedUser);
        
        return {
          success: true,
          user: updatedUser
        };
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('[AUTH] Failed to get user profile:', error);
      // Don't throw error here, return cached user data instead
      return {
        success: true,
        user: this.currentUser
      };
    }
  }

  // Toggle biometric authentication
  async toggleBiometric(enabled) {
    try {
      if (!this.biometricAvailable) {
        return {
          success: false,
          message: 'Biometric authentication is not available on this device'
        };
      }

      if (enabled) {
        // Test biometric authentication first
        await TouchID.authenticate('Enable biometric login for your account', {
          title: 'Enable Biometric Login',
          subtitle: 'Use your biometric to access your account quickly',
          description: 'This will allow you to login securely with your fingerprint or face',
          fallbackLabel: 'Cancel',
          cancelLabel: 'Cancel'
        });
      }

      // Update user preference
      if (this.currentUser) {
        const updatedUser = { ...this.currentUser, biometricEnabled: enabled };
        await this.storeUserData(updatedUser);
        this.currentUser = updatedUser;
      }

      return {
        success: true,
        message: `Biometric authentication ${enabled ? 'enabled' : 'disabled'} successfully`
      };
    } catch (error) {
      console.error('[AUTH] Failed to toggle biometric:', error);
      return {
        success: false,
        message: error.message || 'Failed to toggle biometric authentication'
      };
    }
  }

  // Delete account
  async deleteAccount() {
    try {
      if (!this.authToken) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${BASE_URL}/users/${this.currentUser?.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete account');
      }

      // Clear local data
      await this.clearStoredTokens();

      return {
        success: true,
        message: 'Account deleted successfully'
      };
    } catch (error) {
      console.error('[AUTH] Failed to delete account:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete account'
      };
    }
  }

  // Debug authentication state
  async debugAuthState() {
    console.log('=== AUTH SERVICE DEBUG ===');
    console.log('1. Current state:', {
      isAuthenticated: this.isAuthenticated,
      hasAuthToken: !!this.authToken,
      hasRefreshToken: !!this.refreshToken,
      hasCurrentUser: !!this.currentUser,
      userEmail: this.currentUser?.email
    });
    
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      console.log('2. userToken in storage:', userToken ? userToken.substring(0, 30) + '...' : 'not found');
      
      const authTokens = await AsyncStorage.getItem('auth_tokens');
      console.log('3. auth_tokens in storage:', authTokens ? 'found (encrypted)' : 'not found');
      
      const userData = await AsyncStorage.getItem('userData');
      console.log('4. userData in storage:', userData ? 'found' : 'not found');
      
      // Test current token if available
      if (this.authToken) {
        console.log('5. Testing current token...');
        try {
          const isValid = await this.verifyToken();
          console.log('   Token validation result:', isValid ? 'VALID' : 'INVALID');
        } catch (error) {
          console.log('   Token validation failed:', error.message);
        }
      } else {
        console.log('5. No current token to test');
      }
      
    } catch (error) {
      console.error('Debug failed:', error);
    }
    console.log('=== END AUTH DEBUG ===');
  }

  // Force clear all authentication data (for debugging)
  async forceResetAuth() {
    console.log('[AUTH] 🧹 Force resetting all authentication data...');
    try {
      await AsyncStorage.multiRemove([
        'auth_tokens',
        'user_data', 
        'userData',
        'userToken',
        'device_id'
      ]);
      
      this.authToken = null;
      this.refreshToken = null;
      this.currentUser = null;
      this.isAuthenticated = false;
      
      console.log('[AUTH] ✅ All authentication data cleared');
      return true;
    } catch (error) {
      console.error('[AUTH] ❌ Failed to reset auth:', error);
      return false;
    }
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
