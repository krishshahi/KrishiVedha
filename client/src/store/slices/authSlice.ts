import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService, { ApiUser } from '../../services/apiService';
import authService from '../../services/authService';
import { LoginCredentials, RegisterData, User, UserRole } from '../../types/user.types';

// Helper function to transform ApiUser to User
const transformApiUserToUser = (apiUser: ApiUser): User => {
  const locationParts = apiUser.location ? apiUser.location.split(',') : [];
  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    phone: apiUser.phone,
    profilePicture: apiUser.profilePicture, // Now included from ApiUser
    role: 'farmer' as UserRole, // Default role, as ApiUser doesn't specify
    location: {
      district: locationParts[0]?.trim() || '',
      province: locationParts[1]?.trim() || '',
      country: locationParts[2]?.trim() || '',
    },
    farms: [], // ApiUser doesn't have this field
    preferences: {
      language: 'en' as const,
      measurementUnit: 'metric' as const,
      notificationsEnabled: true,
      weatherAlerts: true,
      cropReminders: true,
      communityUpdates: true,
      theme: 'system' as const,
    },
    isVerified: true, // Default to true
    createdAt: apiUser.createdAt,
    lastLogin: apiUser.updatedAt,
  };
};

const transformApiFarmToFarm = (apiFarm: any): any => {
  return {
    id: apiFarm.id,
    name: apiFarm.name,
    location: {
      address: apiFarm.location,
      coordinates: { type: 'Point', coordinates: [0, 0] },
      country: '',
      state: '',
      city: '',
    },
    size: {
      value: apiFarm.area,
      unit: 'hectares',
    },
    farmType: 'crop',
    crops: apiFarm.crops.map((c: string) => ({ name: c, status: 'unknown' })),
    soilData: {
      ph: 0,
      nitrogen: 0,
      phosphorus: 0,
      potassium: 0,
      organicMatter: 0,
      lastTested: new Date().toISOString(),
    },
    irrigation: {
      system: apiFarm.irrigationMethod || 'unknown',
      waterSource: 'unknown',
    },
  };
};

// Enhanced types for API responses
export interface AuthApiResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

export interface UserStatsResponse {
  farmCount: number;
  totalArea: number;
  cropTypes: string[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  userStats: {
    farmCount: number;
    totalArea: number;
    cropTypes: string[];
  } | null;
  refreshing: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  userStats: null,
  refreshing: false,
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      // Check if backend is available
      const isHealthy = await apiService.healthCheck();
      if (!isHealthy) {
        throw new Error('Unable to connect to server. Please check your network connection.');
      }

      // Use apiService.login which handles token storage through authService
      const { token, user: apiUser } = await apiService.login(credentials);

      // Transform the user object and fetch farms
      const user = transformApiUserToUser(apiUser);
      const apiFarms = await apiService.getFarmsByUserId(user.id);
      user.farms = apiFarms.map(transformApiFarmToFarm);

      // Store user data in AsyncStorage (token is already stored by authService)
      await AsyncStorage.setItem('userData', JSON.stringify(user));

      return { token, user };
    } catch (error: any) {
      let message = 'An unexpected error occurred';
      
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        message = 'Unable to connect to server. Please check if the backend server is running.';
      } else if (error.response?.status === 401) {
        message = 'Invalid email or password.';
      } else if (error.response?.status === 400) {
        message = 'Please check your login credentials and try again.';
      } else if (error.message) {
        message = error.message;
      }
      
      return rejectWithValue(message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterData, { rejectWithValue }) => {
    try {
      // Check if backend is available
      const isHealthy = await apiService.healthCheck();
      if (!isHealthy) {
        throw new Error('Unable to connect to server. Please check your network connection.');
      }

      const { token, user: apiUser } = await apiService.register(userData);
      
      // Transform the user object
      const user = transformApiUserToUser(apiUser);

      // Store user data in AsyncStorage (token is already stored by authService via apiService.register)
      await AsyncStorage.setItem('userData', JSON.stringify(user));

      return { token, user };
    } catch (error: any) {
      let message = 'An unexpected error occurred';
      
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        message = 'Unable to connect to server. Please check if the backend server is running.';
      } else if (error.response?.status === 409) {
        message = 'An account with this email already exists.';
      } else if (error.response?.status === 400) {
        message = 'Please check your registration information and try again.';
      } else if (error.message) {
        message = error.message;
      }
      
      return rejectWithValue(message);
    }
  }
);

export const loadStoredAuth = createAsyncThunk(
  'auth/loadStored',
  async (_, { rejectWithValue }) => {
    try {
      // Use authService to get token consistently
      const token = await authService.getTokenAsync();
      const userData = await AsyncStorage.getItem('userData');
      
      if (token && userData) {
        let user = JSON.parse(userData);
        // Ensure user object has preferences, for backwards compatibility
        if (!user.preferences) {
          user = transformApiUserToUser(user);
        }
        return {
          token,
          user,
        };
      }
      
      return null;
    } catch (error) {
      return rejectWithValue('Failed to load stored authentication');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.clearStoredTokens();
      await AsyncStorage.removeItem('userData');
      return null;
    } catch (error) {
      return rejectWithValue('Failed to logout');
    }
  }
);

// New async thunk to fetch user stats for dashboard
export const fetchUserStats = createAsyncThunk(
  'auth/fetchUserStats',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      if (!state.auth.user?.id) {
        throw new Error('No authenticated user');
      }

      const stats = await apiService.getUserStats(state.auth.user.id);
      return stats;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user statistics');
    }
  }
);

// Sync user data with backend
export const syncUserData = createAsyncThunk(
  'auth/syncUserData',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      if (!state.auth.user?.id) {
        throw new Error('No authenticated user');
      }

      const apiUser = await apiService.getUserById(state.auth.user.id);
      const stats = await apiService.getUserStats(state.auth.user.id);
      
      // Transform ApiUser to User format
      const user = transformApiUserToUser(apiUser);
      
      // Update AsyncStorage with latest data
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      
      return { user, stats };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to sync user data');
    }
  }
);

// Update user profile
export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (userData: Partial<User>, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      if (!state.auth.user?.id) {
        throw new Error('No authenticated user');
      }

      // Transform User data to ApiUser format (for backend)
      const apiUserData: Partial<Omit<ApiUser, 'id' | 'createdAt' | 'updatedAt'>> = {
        ...(userData.name && { name: userData.name }),
        ...(userData.email && { email: userData.email }),
        ...(userData.phone && { phone: userData.phone }),
        ...(userData.profilePicture && { profilePicture: userData.profilePicture }),
        // Convert UserLocation object to string if present
        ...(userData.location && { 
          location: typeof userData.location === 'string' 
            ? userData.location 
            : `${userData.location.district}, ${userData.location.province}, ${userData.location.country}`
        }),
        // Handle preferences - store as JSON string if backend doesn't have preference fields
        ...(userData.preferences && { preferences: JSON.stringify(userData.preferences) })
      };

      const updatedApiUser = await apiService.updateUser(state.auth.user.id, apiUserData);
      
      // Transform ApiUser back to User format
      const updatedUser = transformApiUserToUser(updatedApiUser);
      
      // Update AsyncStorage
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      
      return updatedUser;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update user profile');
    }
  }
);

// Forgot Password Actions
export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      // Check if backend is available
      const isHealthy = await apiService.healthCheck();
      if (!isHealthy) {
        throw new Error('Unable to connect to server. Please check your network connection.');
      }

      const result = await apiService.forgotPassword(email);
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      return { message: result.message };
    } catch (error: any) {
      let message = 'An unexpected error occurred';
      
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        message = 'Unable to connect to server. Please check your network connection.';
      } else if (error.response?.status === 404) {
        message = 'No account found with this email address.';
      } else if (error.response?.status === 429) {
        message = 'Too many requests. Please try again later.';
      } else if (error.message) {
        message = error.message;
      }
      
      return rejectWithValue(message);
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, newPassword }: { token: string; newPassword: string }, { rejectWithValue }) => {
    try {
      // Check if backend is available
      const isHealthy = await apiService.healthCheck();
      if (!isHealthy) {
        throw new Error('Unable to connect to server. Please check your network connection.');
      }

      const result = await apiService.resetPassword(token, newPassword);
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      return { message: result.message };
    } catch (error: any) {
      let message = 'An unexpected error occurred';
      
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        message = 'Unable to connect to server. Please check your network connection.';
      } else if (error.response?.status === 400) {
        message = 'Invalid or expired reset token.';
      } else if (error.response?.status === 422) {
        message = 'Password does not meet requirements.';
      } else if (error.message) {
        message = error.message;
      }
      
      return rejectWithValue(message);
    }
  }
);

export const verifyResetToken = createAsyncThunk(
  'auth/verifyResetToken',
  async (token: string, { rejectWithValue }) => {
    try {
      // Check if backend is available
      const isHealthy = await apiService.healthCheck();
      if (!isHealthy) {
        throw new Error('Unable to connect to server. Please check your network connection.');
      }

      const result = await apiService.verifyResetToken(token);
      
      if (!result.valid) {
        throw new Error(result.message || 'Invalid or expired reset token');
      }
      
      return { valid: true, message: result.message };
    } catch (error: any) {
      let message = 'An unexpected error occurred';
      
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        message = 'Unable to connect to server. Please check your network connection.';
      } else if (error.message) {
        message = error.message;
      }
      
      return rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setRefreshing: (state, action: PayloadAction<boolean>) => {
      state.refreshing = action.payload;
    },
    resetUserStats: (state) => {
      state.userStats = null;
    },
    setNotificationPreference: (state, action: PayloadAction<{ key: string; value: boolean }>) => {
      if (state.user) {
        // Initialize preferences if they don't exist
        if (!state.user.preferences) {
          state.user.preferences = {
            weatherAlerts: true,
            cropReminders: true,
            communityUpdates: true,
            notificationsEnabled: true
          };
        }
        
        // Create a new preferences object with Immer-safe mutation
        const currentPreferences = state.user.preferences || {};
        const newPreferences = {
          weatherAlerts: currentPreferences.weatherAlerts ?? true,
          cropReminders: currentPreferences.cropReminders ?? true,
          communityUpdates: currentPreferences.communityUpdates ?? true,
          notificationsEnabled: currentPreferences.notificationsEnabled ?? true,
          // Apply the new value
          [action.payload.key]: action.payload.value
        };
        
        // Update the state
        state.user.preferences = newPreferences;
        
        // Update AsyncStorage with the modified user data (async operation outside reducer)
        setTimeout(() => {
          try {
            const userToStore = { ...state.user };
            AsyncStorage.setItem('userData', JSON.stringify(userToStore));
          } catch (error) {
            console.error('Failed to update AsyncStorage in setNotificationPreference:', error);
          }
        }, 0);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload as string;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload as string;
      })
      // Load stored auth
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.token = action.payload.token;
        }
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = null;
      })
      // Fetch user stats
      .addCase(fetchUserStats.pending, (state) => {
        state.refreshing = true;
      })
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.refreshing = false;
        state.userStats = action.payload;
      })
      .addCase(fetchUserStats.rejected, (state, action) => {
        state.refreshing = false;
        state.error = action.payload as string;
      })
      // Sync user data
      .addCase(syncUserData.pending, (state) => {
        state.refreshing = true;
      })
      .addCase(syncUserData.fulfilled, (state, action) => {
        state.refreshing = false;
        state.user = action.payload.user;
        state.userStats = action.payload.stats;
      })
      .addCase(syncUserData.rejected, (state, action) => {
        state.refreshing = false;
        state.error = action.payload as string;
      })
      // Update user profile
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Forgot password
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Reset password
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Verify reset token
      .addCase(verifyResetToken.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyResetToken.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(verifyResetToken.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, updateUser, setRefreshing, resetUserStats, setNotificationPreference } = authSlice.actions;
export default authSlice.reducer;
