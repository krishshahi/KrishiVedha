import axios, { AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend API configuration
const API_BASE_URL = 'http://localhost:3000/api';
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
      const token = await AsyncStorage.getItem('auth_token');
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
    if (error.response?.status === 401) {
      // Token expired or invalid - clear stored token
      await AsyncStorage.removeItem('auth_token');
      // Optionally redirect to login
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
  createdAt: string;
  updatedAt: string;
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

  // User Management APIs
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

  // Farm Management APIs
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
}

export default new ApiService();

