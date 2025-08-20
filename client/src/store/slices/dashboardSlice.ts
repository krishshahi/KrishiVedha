import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiService from '../../services/apiService';

// Dashboard state interface
export interface DashboardState {
  userStats: {
    farmCount: number;
    totalArea: number;
    cropTypes: string[];
  } | null;
  recentFarms: any[];
  weatherData: any[];
  communityPosts: any[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: DashboardState = {
  userStats: null,
  recentFarms: [],
  weatherData: [],
  communityPosts: [],
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastUpdated: null,
};

// Async thunks for dashboard data
export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchDashboardData',
  async (userId: string, { rejectWithValue }) => {
    try {
      const [userStats, userFarms, weatherData, communityPosts] = await Promise.all([
        apiService.getUserStats(userId),
        apiService.getFarmsByUserId(userId),
        apiService.getWeatherData().catch(() => []), // Don't fail if weather is unavailable
        apiService.getCommunityPosts({ limit: 5 }).catch(() => []), // Don't fail if community is unavailable
      ]);

      return {
        userStats,
        recentFarms: userFarms.slice(0, 3), // Get latest 3 farms
        weatherData: weatherData.slice(0, 7), // Get latest 7 weather entries
        communityPosts: communityPosts.slice(0, 5), // Get latest 5 posts
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch dashboard data');
    }
  }
);

export const refreshDashboardData = createAsyncThunk(
  'dashboard/refreshDashboardData',
  async (userId: string, { rejectWithValue }) => {
    try {
      const [userStats, userFarms, weatherData, communityPosts] = await Promise.all([
        apiService.getUserStats(userId),
        apiService.getFarmsByUserId(userId),
        apiService.getWeatherData().catch(() => []),
        apiService.getCommunityPosts({ limit: 5 }).catch(() => []),
      ]);

      return {
        userStats,
        recentFarms: userFarms.slice(0, 3),
        weatherData: weatherData.slice(0, 7),
        communityPosts: communityPosts.slice(0, 5),
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to refresh dashboard data');
    }
  }
);

// Fetch user statistics only
export const fetchUserStats = createAsyncThunk(
  'dashboard/fetchUserStats',
  async (userId: string, { rejectWithValue }) => {
    try {
      const userStats = await apiService.getUserStats(userId);
      return userStats;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user statistics');
    }
  }
);

// Fetch weather data
export const fetchWeatherData = createAsyncThunk(
  'dashboard/fetchWeatherData',
  async (params: { lat?: number; lng?: number; farmId?: string } = {}, { rejectWithValue }) => {
    try {
      const weatherData = await apiService.getWeatherData(params);
      return weatherData;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch weather data');
    }
  }
);

// Fetch community posts
export const fetchCommunityPosts = createAsyncThunk(
  'dashboard/fetchCommunityPosts',
  async (params: { category?: string; userId?: string; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const posts = await apiService.getCommunityPosts(params);
      return posts;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch community posts');
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setRefreshing: (state, action: PayloadAction<boolean>) => {
      state.isRefreshing = action.payload;
    },
    updateUserStats: (state, action: PayloadAction<{ farmCount: number; totalArea: number; cropTypes: string[] }>) => {
      state.userStats = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    resetDashboard: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch dashboard data
      .addCase(fetchDashboardData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userStats = action.payload.userStats;
        state.recentFarms = action.payload.recentFarms;
        state.weatherData = action.payload.weatherData;
        state.communityPosts = action.payload.communityPosts;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Refresh dashboard data
      .addCase(refreshDashboardData.pending, (state) => {
        state.isRefreshing = true;
        state.error = null;
      })
      .addCase(refreshDashboardData.fulfilled, (state, action) => {
        state.isRefreshing = false;
        state.userStats = action.payload.userStats;
        state.recentFarms = action.payload.recentFarms;
        state.weatherData = action.payload.weatherData;
        state.communityPosts = action.payload.communityPosts;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(refreshDashboardData.rejected, (state, action) => {
        state.isRefreshing = false;
        state.error = action.payload as string;
      })
      // Fetch user stats
      .addCase(fetchUserStats.pending, (state) => {
        state.isRefreshing = true;
      })
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.isRefreshing = false;
        state.userStats = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchUserStats.rejected, (state, action) => {
        state.isRefreshing = false;
        state.error = action.payload as string;
      })
      // Fetch weather data
      .addCase(fetchWeatherData.fulfilled, (state, action) => {
        state.weatherData = action.payload;
      })
      .addCase(fetchWeatherData.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Fetch community posts
      .addCase(fetchCommunityPosts.fulfilled, (state, action) => {
        state.communityPosts = action.payload;
      })
      .addCase(fetchCommunityPosts.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setRefreshing, updateUserStats, resetDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;

