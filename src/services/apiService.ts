import axios, { AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Backend API configuration
const API_BASE_URL = Constants.expoConfig?.extra?.REACT_NATIVE_API_URL || 'http://localhost:3000/api';
const API_TIMEOUT = 10000; // 10 seconds

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if available
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Enhanced error logging for debugging
    if (error.response) {
      console.error('🚨 API Response Error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
        method: error.config?.method?.toUpperCase()
      });
      
      if (error.response.status === 401) {
        // Token expired or invalid - clear stored token
        await AsyncStorage.removeItem('userToken');
        console.log('🔑 Auth token cleared due to 401 error');
      }
    } else if (error.request) {
      console.error('🌐 Network Error:', {
        message: error.message,
        code: error.code,
        url: error.config?.url
      });
    } else {
      console.error('⚙️ Request Setup Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Types for API responses
export interface ApiUser {
  id: string;
  name: string;
  email: string;
  location: string;
  phone?: string;
  farmCount?: number;
  totalArea?: number;
  joinDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: ApiUser;
  message?: string;
}

export interface ApiFarm {
  id: string;
  userId: string;
  name: string;
  location: string;
  area: number;
  crops: string[];
  soilType?: string;
  irrigationMethod?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  totalFarms: number;
  totalArea: number;
  activeCrops: number;
  recentActivity: any[];
  weatherSummary: any;
}

class ApiService {
  /**
   * Check if backend server is running
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await apiClient.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }

  // ===== AUTHENTICATION APIs =====
  
  /**
   * Register new user
   */
  async register(userData: { name: string; email: string; password: string; location?: string; phone?: string }): Promise<{ token: string; user: ApiUser }> {
    try {
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(credentials: { email: string; password: string }): Promise<{ token: string; user: ApiUser }> {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Refresh user token
   */
  async refreshToken(): Promise<{ token: string; user: ApiUser }> {
    try {
      const response = await apiClient.post('/auth/refresh');
      return response.data;
    } catch (error: any) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Verify token validity
   */
  async verifyToken(): Promise<boolean> {
    try {
      const response = await apiClient.get('/auth/verify');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  // ===== USER MANAGEMENT APIs =====
  
  /**
   * Get all users
   */
  async getUsers(): Promise<ApiUser[]> {
    try {
      const response: AxiosResponse<ApiResponse<ApiUser[]>> = await apiClient.get('/users');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<ApiUser> {
    try {
      const response: AxiosResponse<ApiResponse<ApiUser>> = await apiClient.get(`/users/${userId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new Error('Failed to fetch user');
    }
  }

  /**
   * Create new user
   */
  async createUser(userData: Omit<ApiUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiUser> {
    try {
      const response: AxiosResponse<ApiResponse<ApiUser>> = await apiClient.post('/users', userData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  /**
   * Update user
   */
  async updateUser(userId: string, userData: Partial<Omit<ApiUser, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiUser> {
    try {
      const response: AxiosResponse<ApiResponse<ApiUser>> = await apiClient.put(`/users/${userId}`, userData);
      return response.data.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      await apiClient.delete(`/users/${userId}`);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  // ===== FARM MANAGEMENT APIs =====
  
  /**
   * Get all farms
   */
  async getFarms(): Promise<ApiFarm[]> {
    try {
      const response: AxiosResponse<ApiResponse<ApiFarm[]>> = await apiClient.get('/farms');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching farms:', error);
      throw new Error('Failed to fetch farms');
    }
  }

  /**
   * Get farms by user ID
   */
  async getFarmsByUserId(userId: string): Promise<ApiFarm[]> {
    try {
      const response: AxiosResponse<ApiResponse<ApiFarm[]>> = await apiClient.get(`/users/${userId}/farms`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching user farms:', error);
      throw new Error('Failed to fetch user farms');
    }
  }

  /**
   * Get farm by ID
   */
  async getFarmById(farmId: string): Promise<ApiFarm> {
    try {
      const response: AxiosResponse<ApiResponse<ApiFarm>> = await apiClient.get(`/farms/${farmId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching farm:', error);
      throw new Error('Failed to fetch farm');
    }
  }

  /**
   * Create new farm
   */
  async createFarm(farmData: Omit<ApiFarm, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiFarm> {
    try {
      const response: AxiosResponse<ApiResponse<ApiFarm>> = await apiClient.post('/farms', farmData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating farm:', error);
      throw new Error('Failed to create farm');
    }
  }

  /**
   * Update farm
   */
  async updateFarm(farmId: string, farmData: Partial<Omit<ApiFarm, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiFarm> {
    try {
      const response: AxiosResponse<ApiResponse<ApiFarm>> = await apiClient.put(`/farms/${farmId}`, farmData);
      return response.data.data;
    } catch (error) {
      console.error('Error updating farm:', error);
      throw new Error('Failed to update farm');
    }
  }

  /**
   * Delete farm
   */
  async deleteFarm(farmId: string): Promise<void> {
    try {
      await apiClient.delete(`/farms/${farmId}`);
    } catch (error) {
      console.error('Error deleting farm:', error);
      throw new Error('Failed to delete farm');
    }
  }

  // Utility methods
  /**
   * Upload image/file (if needed in future)
   */
  async uploadFile(file: FormData, endpoint: string): Promise<string> {
    try {
      const response = await apiClient.post(endpoint, file, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.url;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  }

  /**
   * Search farms by location or crop
   */
  async searchFarms(query: string): Promise<ApiFarm[]> {
    try {
      const response: AxiosResponse<ApiResponse<ApiFarm[]>> = await apiClient.get('/farms/search', {
        params: { q: query }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error searching farms:', error);
      throw new Error('Failed to search farms');
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<{farmCount: number, totalArea: number, cropTypes: string[]}> {
    try {
      const farms = await this.getFarmsByUserId(userId);
      const farmCount = farms.length;
      const totalArea = farms.reduce((sum, farm) => sum + farm.area, 0);
      const cropTypes = [...new Set(farms.flatMap(farm => farm.crops))];
      
      return { farmCount, totalArea, cropTypes };
    } catch (error) {
      console.error('Error calculating user stats:', error);
      return { farmCount: 0, totalArea: 0, cropTypes: [] };
    }
  }

  // ===== CROP MANAGEMENT APIs =====
  
  /**
   * Get all crops
   */
  async getCrops(farmId?: string, userId?: string): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (farmId) params.append('farmId', farmId);
      if (userId) params.append('userId', userId);
      
      const response = await apiClient.get(`/crops?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching crops:', error);
      throw new Error('Failed to fetch crops');
    }
  }
  
  /**
   * Get crop by ID
   */
  async getCropById(cropId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/crops/${cropId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching crop:', error);
      throw new Error('Failed to fetch crop');
    }
  }
  
  /**
   * Create new crop
   */
  async createCrop(cropData: any): Promise<any> {
    try {
      const response = await apiClient.post('/crops', cropData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating crop:', error);
      throw new Error('Failed to create crop');
    }
  }
  
  /**
   * Update crop
   */
  async updateCrop(cropId: string, cropData: any): Promise<any> {
    try {
      const response = await apiClient.put(`/crops/${cropId}`, cropData);
      return response.data.data;
    } catch (error) {
      console.error('Error updating crop:', error);
      throw new Error('Failed to update crop');
    }
  }
  
  /**
   * Delete crop
   */
  async deleteCrop(cropId: string): Promise<void> {
    try {
      await apiClient.delete(`/crops/${cropId}`);
    } catch (error) {
      console.error('Error deleting crop:', error);
      throw new Error('Failed to delete crop');
    }
  }

  // ===== WEATHER APIs =====
  
  /**
   * Get weather data
   */
  async getWeatherData(params?: { lat?: number; lng?: number; farmId?: string }): Promise<any[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.lat) queryParams.append('lat', params.lat.toString());
      if (params?.lng) queryParams.append('lng', params.lng.toString());
      if (params?.farmId) queryParams.append('farmId', params.farmId);
      
      const response = await apiClient.get(`/weather?${queryParams.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw new Error('Failed to fetch weather data');
    }
  }

  // ===== COMMUNITY APIs =====
  
  /**
   * Get community posts
   */
  async getCommunityPosts(params?: { category?: string; userId?: string; limit?: number; page?: number }): Promise<any[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.category) queryParams.append('category', params.category);
      if (params?.userId) queryParams.append('userId', params.userId);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.page) queryParams.append('page', params.page.toString());
      
      const response = await apiClient.get(`/community/posts?${queryParams.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching community posts:', error);
      throw new Error('Failed to fetch community posts');
    }
  }
  
  /**
   * Create community post
   */
  async createCommunityPost(postData: any): Promise<any> {
    try {
      const response = await apiClient.post('/community/posts', postData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating community post:', error);
      throw new Error('Failed to create community post');
    }
  }
  
  // ===== ANALYTICS APIs =====
  
  /**
   * Get dashboard analytics
   */
  async getDashboardAnalytics(userId: string): Promise<{
    totalFarms: number;
    totalArea: number;
    activeCrops: number;
    recentActivity: any[];
    weatherSummary: any;
  }> {
    try {
      const response = await apiClient.get(`/analytics/dashboard/${userId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      // Return default data if API fails
      return {
        totalFarms: 0,
        totalArea: 0,
        activeCrops: 0,
        recentActivity: [],
        weatherSummary: null
      };
    }
  }

  // ===== GENERIC REQUEST METHODS =====
  
  async get(url: string, config?: any) {
    return apiClient.get(url, config);
  }
  
  async post(url: string, data?: any, config?: any) {
    return apiClient.post(url, data, config);
  }
  
  async put(url: string, data?: any, config?: any) {
    return apiClient.put(url, data, config);
  }
  
  async delete(url: string, config?: any) {
    return apiClient.delete(url, config);
  }
}

export default new ApiService();
