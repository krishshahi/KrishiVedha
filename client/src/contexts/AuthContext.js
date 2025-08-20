import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      setAuthError(null);
      
      await authService.initialize();
      
      const authState = authService.getAuthState();
      console.log('[AuthContext] Auth state:', authState);
      
      setIsAuthenticated(authState.isAuthenticated);
      setUser(authState.user);
      
      if (authState.isAuthenticated && authState.user) {
        console.log('[AuthContext] User authenticated, loading profile...');
        // Only refresh if we have valid authentication
        try {
          const profileResult = await authService.getUserProfile();
          if (profileResult && profileResult.success) {
            setUser(profileResult.user);
            console.log('[AuthContext] Profile refreshed successfully');
          }
        } catch (error) {
          console.warn('[AuthContext] Failed to refresh user profile:', error);
          // Keep using cached user data if profile refresh fails
        }
      } else {
        console.log('[AuthContext] User not authenticated');
      }
    } catch (error) {
      console.error('[AuthContext] Failed to initialize auth:', error);
      setAuthError('Failed to initialize authentication');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setAuthError(null);
      const result = await authService.login(credentials);
      
      if (result.success) {
        setIsAuthenticated(true);
        setUser(result.user);
        return result;
      } else {
        setAuthError(result.message);
        return result;
      }
    } catch (error) {
      const errorMessage = 'Network error. Please check your connection and try again.';
      setAuthError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      setAuthError(null);
      const result = await authService.register(userData);
      
      if (result.success) {
        setIsAuthenticated(true);
        setUser(result.user);
        return result;
      } else {
        setAuthError(result.message);
        return result;
      }
    } catch (error) {
      const errorMessage = 'Network error. Please check your connection and try again.';
      setAuthError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const biometricLogin = async () => {
    try {
      setAuthError(null);
      const result = await authService.biometricLogin();
      
      if (result.success) {
        setIsAuthenticated(true);
        setUser(result.user);
        return result;
      } else {
        setAuthError(result.message);
        return result;
      }
    } catch (error) {
      const errorMessage = 'Biometric authentication failed. Please try again.';
      setAuthError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setAuthError(null);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const clearError = () => {
    setAuthError(null);
  };

  const refreshAuth = async () => {
    try {
      const authState = authService.getAuthState();
      setIsAuthenticated(authState.isAuthenticated);
      setUser(authState.user);
      
      if (authState.isAuthenticated && authState.user) {
        const profileResult = await authService.getUserProfile();
        if (profileResult.success) {
          setUser(profileResult.user);
        }
      }
    } catch (error) {
      console.error('Failed to refresh auth:', error);
    }
  };

  const resetPassword = async (email) => {
    try {
      setAuthError(null);
      const result = await authService.resetPassword(email);
      return result;
    } catch (error) {
      const errorMessage = 'Failed to send reset email. Please try again.';
      setAuthError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      setAuthError(null);
      const result = await authService.changePassword(passwordData);
      return result;
    } catch (error) {
      const errorMessage = 'Failed to change password. Please try again.';
      setAuthError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const toggleBiometric = async (enabled) => {
    try {
      setAuthError(null);
      const result = await authService.toggleBiometric(enabled);
      return result;
    } catch (error) {
      const errorMessage = 'Failed to update biometric settings. Please try again.';
      setAuthError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const deleteAccount = async () => {
    try {
      setAuthError(null);
      const result = await authService.deleteAccount();
      
      if (result.success) {
        setIsAuthenticated(false);
        setUser(null);
      }
      
      return result;
    } catch (error) {
      const errorMessage = 'Failed to delete account. Please try again.';
      setAuthError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const value = {
    // State
    isLoading,
    isAuthenticated,
    user,
    authError,
    
    // Actions
    login,
    register,
    biometricLogin,
    logout,
    updateUser,
    clearError,
    refreshAuth,
    resetPassword,
    changePassword,
    toggleBiometric,
    deleteAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
