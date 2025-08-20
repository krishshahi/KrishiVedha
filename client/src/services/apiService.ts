import axios, { AxiosResponse, AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { autoDetectApiUrl, getApiBaseUrl } from '../config/network';

// API client instance (will be initialized asynchronously)
let apiClient: AxiosInstance | null = null;
let apiInitialized = false;
const API_TIMEOUT = 15000; // 15 seconds (increased for better reliability)
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Initialize API client with dynamic network configuration
const initializeApiClient = async (): Promise<AxiosInstance> => {
  if (apiClient && apiInitialized) {
    return apiClient;
  }

  try {
    console.log('🔄 Initializing API client with network auto-detection...');
    
    // First try to use the configured URL from app.json
    let API_BASE_URL = Constants.expoConfig?.extra?.REACT_NATIVE_API_URL as string;
    
    if (!API_BASE_URL) {
      console.log('📍 No configured API URL found, using auto-detection...');
      // Auto-detect the best API URL
      API_BASE_URL = await autoDetectApiUrl();
    } else {
      console.log('📍 Using configured API URL:', API_BASE_URL);
    }
    
    console.log('🔧 API Configuration:', {
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      isDev: __DEV__
    });

    // Create axios instance with detected configuration
    apiClient = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Setup interceptors for this instance
    setupInterceptors(apiClient);

    apiInitialized = true;
    return apiClient;
  } catch (error) {
    console.error('❌ Failed to initialize API client:', error);
    
    // Fallback to a basic configuration without connectivity testing
    const fallbackURL = await getApiBaseUrl();
    console.log('🔄 Using fallback API URL (no connectivity test):', fallbackURL);
    
    apiClient = axios.create({
      baseURL: fallbackURL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Setup interceptors for fallback client too
    setupInterceptors(apiClient);
    
    apiInitialized = true;
    return apiClient;
  }
};

// Get or initialize API client
const getApiClient = async (): Promise<AxiosInstance> => {
  if (!apiClient || !apiInitialized) {
    return await initializeApiClient();
  }
  return apiClient;
};

// Force re-initialization of API client (useful when network changes)
export const reinitializeApiClient = async (): Promise<AxiosInstance> => {
  console.log('🔄 Forcing API client re-initialization...');
  apiClient = null;
  apiInitialized = false;
  return await initializeApiClient();
};

// Setup interceptors for axios instance
const setupInterceptors = (client: AxiosInstance) => {
  // Request interceptor to add auth token if available
  client.interceptors.request.use(
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
  client.interceptors.response.use(
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
};

// Types for API responses
export interface ApiUser {
  id: string;
  name: string;
  email: string;
  location: string;
  phone?: string;
  profilePicture?: string;
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
   * Get the current base URL (without /api suffix)
   */
  get baseURL(): string {
    let baseURL = apiClient?.defaults.baseURL || 'http://localhost:3000';
    
    // Remove /api suffix if present for general base URL
    if (baseURL.endsWith('/api')) {
      baseURL = baseURL.slice(0, -4);
    }
    
    return baseURL;
  }
  
  /**
   * Check if backend server is running
   */
  async healthCheck(): Promise<boolean> {
    try {
      const client = await getApiClient();
      const response = await client.get('/health');
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
      const client = await getApiClient();
      const response = await client.post('/auth/register', userData);
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
      const client = await getApiClient();
      const response = await client.post('/auth/login', credentials);
      const { token, user } = response.data;
      await AsyncStorage.setItem('userToken', token); // Save token for future requests
      return { token, user };
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
      const client = await getApiClient();
      const response = await client.post('/auth/refresh');
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
      const client = await getApiClient();
      const response = await client.get('/auth/verify');
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
      const client = await getApiClient();
      const response: AxiosResponse<ApiResponse<ApiUser[]>> = await client.get('/users');
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
      const client = await getApiClient();
      const response: AxiosResponse<ApiResponse<ApiUser>> = await client.get(`/users/${userId}`);
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
      const client = await getApiClient();
      const response: AxiosResponse<ApiResponse<ApiUser>> = await client.post('/users', userData);
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
      const client = await getApiClient();
      const response: AxiosResponse<ApiResponse<ApiUser>> = await client.put(`/users/${userId}`, userData);
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
      const client = await getApiClient();
      await client.delete(`/users/${userId}`);
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
      const client = await getApiClient();
      const response: AxiosResponse<ApiResponse<ApiFarm[]>> = await client.get('/farms');
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
      const client = await getApiClient();
      const response: AxiosResponse<ApiResponse<ApiFarm[]>> = await client.get(`/users/${userId}/farms`);
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
      const client = await getApiClient();
      const response: AxiosResponse<ApiResponse<ApiFarm>> = await client.get(`/farms/${farmId}`);
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
      const client = await getApiClient();
      const response: AxiosResponse<ApiResponse<ApiFarm>> = await client.post('/farms', farmData);
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
      const client = await getApiClient();
      const response: AxiosResponse<ApiResponse<ApiFarm>> = await client.put(`/farms/${farmId}`, farmData);
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
      console.log('🚨 API Service: Attempting to delete farm with ID:', farmId);
      const client = await getApiClient();
      console.log('🚨 API Service: Got client, making DELETE request to:', `/farms/${farmId}`);
      const response = await client.delete(`/farms/${farmId}`);
      console.log('🚨 API Service: Delete response:', response.status, response.statusText);
      console.log('🚨 API Service: Delete response data:', response.data);
    } catch (error: any) {
      console.error('🚨 API Service: Error deleting farm:', error);
      console.error('🚨 API Service: Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      throw new Error(`Failed to delete farm: ${error.response?.data?.message || error.message}`);
    }
  }

  // Utility methods
  /**
   * Upload image/file (if needed in future)
   */
  async uploadFile(file: FormData, endpoint: string): Promise<string> {
    try {
      const client = await getApiClient();
      const response = await client.post(endpoint, file, {
        // Let axios set Content-Type with proper boundary
        timeout: 30000,
        maxContentLength: 50 * 1024 * 1024,
        maxBodyLength: 50 * 1024 * 1024,
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
      const client = await getApiClient();
      const response: AxiosResponse<ApiResponse<ApiFarm[]>> = await client.get('/farms/search', {
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
      console.log(`[API] 📊 Fetching user stats for userId: ${userId}`);
      const client = await getApiClient();
      const response: AxiosResponse<ApiResponse<{farmCount: number, totalArea: number, cropTypes: string[]}>> = await client.get(`/users/${userId}/stats`);
      console.log(`[API] 📊 Direct user stats response:`, response.data.data);
      return response.data.data;
    } catch (error) {
      console.error(`[API] ❌ Error fetching user stats for userId ${userId}:`, error);
      // Fallback to calculating from farms if direct endpoint fails
      try {
        console.log(`[API] 🔄 Using fallback: calculating stats from farms for userId: ${userId}`);
        const farms = await this.getFarmsByUserId(userId);
        console.log(`[API] 🔄 Fetched ${farms.length} farms for userId ${userId}:`, farms.map(f => ({ id: f.id, name: f.name, crops: f.crops })));
        
        const farmCount = farms.length;
        const totalArea = farms.reduce((sum, farm) => sum + farm.area, 0);
        const cropTypes = [...new Set(farms.flatMap(farm => farm.crops))];
        
        const calculatedStats = { farmCount, totalArea, cropTypes };
        console.log(`[API] 📊 Calculated stats for userId ${userId}:`, calculatedStats);
        
        return calculatedStats;
      } catch (fallbackError) {
        console.error(`[API] ❌ Error calculating user stats from farms for userId ${userId}:`, fallbackError);
        return { farmCount: 0, totalArea: 0, cropTypes: [] };
      }
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
      
      const client = await getApiClient();
      const response = await client.get(`/crops?${params.toString()}`);
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
      const client = await getApiClient();
      const response = await client.get(`/crops/${cropId}`);
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
      const client = await getApiClient();
      const response = await client.post('/crops', cropData);
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
      const client = await getApiClient();
      const response = await client.put(`/crops/${cropId}`, cropData);
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
      const client = await getApiClient();
      await client.delete(`/crops/${cropId}`);
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
      
      const client = await getApiClient();
      const response = await client.get(`/weather?${queryParams.toString()}`);
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
      
      const client = await getApiClient();
      const response = await client.get(`/community/posts?${queryParams.toString()}`);
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
      const client = await getApiClient();
      const response = await client.post('/community/posts', postData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating community post:', error);
      throw new Error('Failed to create community post');
    }
  }
  
  /**
   * Get post by ID
   */
  async getCommunityPostById(postId: string): Promise<any> {
    try {
      const client = await getApiClient();
      const response = await client.get(`/community/posts/${postId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching community post:', error);
      throw new Error('Failed to fetch community post');
    }
  }
  
  /**
   * Update community post
   */
  async updateCommunityPost(postId: string, postData: any): Promise<any> {
    try {
      const client = await getApiClient();
      const response = await client.put(`/community/posts/${postId}`, postData);
      return response.data.data;
    } catch (error) {
      console.error('Error updating community post:', error);
      throw new Error('Failed to update community post');
    }
  }
  
  /**
   * Delete community post
   */
  async deleteCommunityPost(postId: string): Promise<void> {
    try {
      const client = await getApiClient();
      await client.delete(`/community/posts/${postId}`);
    } catch (error) {
      console.error('Error deleting community post:', error);
      throw new Error('Failed to delete community post');
    }
  }
  
  /**
   * Like a community post
   */
  async likeCommunityPost(postId: string): Promise<any> {
    try {
      const client = await getApiClient();
      const response = await client.post(`/community/posts/${postId}/like`);
      return response.data.data;
    } catch (error) {
      console.error('Error liking community post:', error);
      throw new Error('Failed to like community post');
    }
  }
  
  /**
   * Unlike a community post
   */
  async unlikeCommunityPost(postId: string): Promise<any> {
    try {
      const client = await getApiClient();
      const response = await client.delete(`/community/posts/${postId}/like`);
      return response.data.data;
    } catch (error) {
      console.error('Error unliking community post:', error);
      throw new Error('Failed to unlike community post');
    }
  }
  
  /**
   * Get comments for a post
   */
  async getPostComments(postId: string): Promise<any[]> {
    try {
      const client = await getApiClient();
      const response = await client.get(`/community/posts/${postId}/comments`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching post comments:', error);
      throw new Error('Failed to fetch post comments');
    }
  }
  
  /**
   * Add comment to a post
   */
  async addPostComment(postId: string, content: string): Promise<any> {
    try {
      const client = await getApiClient();
      const response = await client.post(`/community/posts/${postId}/comments`, { content });
      return response.data.data;
    } catch (error) {
      console.error('Error adding post comment:', error);
      throw new Error('Failed to add post comment');
    }
  }
  
  /**
   * Like a comment
   */
  async likeComment(commentId: string): Promise<any> {
    try {
      const client = await getApiClient();
      const response = await client.post(`/community/comments/${commentId}/like`);
      return response.data.data;
    } catch (error) {
      console.error('Error liking comment:', error);
      throw new Error('Failed to like comment');
    }
  }
  
  /**
   * Search community posts
   */
  async searchCommunityPosts(query: string): Promise<any[]> {
    try {
      const client = await getApiClient();
      const response = await client.get('/community/posts/search', {
        params: { q: query }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error searching community posts:', error);
      throw new Error('Failed to search community posts');
    }
  }
  
  /**
   * Get trending posts
   */
  async getTrendingPosts(limit?: number): Promise<any[]> {
    try {
      const client = await getApiClient();
      const response = await client.get('/community/posts/trending', {
        params: { limit: limit || 10 }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching trending posts:', error);
      throw new Error('Failed to fetch trending posts');
    }
  }
  
  /**
   * Get expert advice posts
   */
  async getExpertAdvice(): Promise<any[]> {
    try {
      const client = await getApiClient();
      const response = await client.get('/community/expert-advice');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching expert advice:', error);
      throw new Error('Failed to fetch expert advice');
    }
  }
  
  /**
   * Submit question to experts
   */
  async submitExpertQuestion(questionData: { title: string; content: string; category?: string }): Promise<any> {
    try {
      const client = await getApiClient();
      const response = await client.post('/community/expert-questions', questionData);
      return response.data.data;
    } catch (error) {
      console.error('Error submitting expert question:', error);
      throw new Error('Failed to submit expert question');
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
      const client = await getApiClient();
      const response = await client.get(`/analytics/dashboard/${userId}`);
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

  // ===== IMAGE UPLOAD APIs =====

  /**
   * Upload single image
   */
  async uploadImage(formData: FormData): Promise<ApiResponse<any>> {
    try {
      const client = await getApiClient();
      
      // Log FormData for debugging
      console.log('📤 Uploading FormData to /upload/image');
      
      const response = await client.post('/upload/image', formData, {
        // DO NOT set Content-Type header - let axios/React Native handle it automatically
        timeout: 30000,
        maxContentLength: 50 * 1024 * 1024,
        maxBodyLength: 50 * 1024 * 1024,
      });
      
      console.log('📤 Upload response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('📤 Upload image error:', error);
      if (error.response) {
        console.error('📤 Upload error response:', error.response.data);
        console.error('📤 Error status:', error.response.status);
        throw new Error(error.response.data?.message || 'Failed to upload image');
      } else if (error.request) {
        console.error('📤 Upload network error:', error.message);
        throw new Error('Network error during upload. Please check your connection.');
      } else {
        console.error('📤 Upload setup error:', error.message);
        throw new Error('Failed to upload image');
      }
    }
  }

  /**
   * Upload multiple images
   */
  async uploadMultipleImages(formData: FormData): Promise<ApiResponse<any[]>> {
    try {
      const client = await getApiClient();
      const response = await client.post('/upload/images', formData, {
        // Let axios set Content-Type with proper boundary
        timeout: 30000,
        maxContentLength: 50 * 1024 * 1024,
        maxBodyLength: 50 * 1024 * 1024,
      });
      return response.data;
    } catch (error) {
      console.error('Upload multiple images error:', error);
      throw new Error('Failed to upload multiple images');
    }
  }

  /**
   * Add image to crop
   */
  async addImageToCrop(cropId: string, formData: FormData): Promise<ApiResponse<any>> {
    try {
      console.log('📤 addImageToCrop called with cropId:', cropId);
      
      const client = await getApiClient();
      console.log('📤 API client initialized, baseURL:', client.defaults.baseURL);
      
      const endpoint = `/crops/${cropId}/images`;
      console.log('📤 Making POST request to:', endpoint);
      console.log('📤 Full URL would be:', `${client.defaults.baseURL}${endpoint}`);
      
      // Log FormData contents (for debugging)
      console.log('📤 FormData keys:', Array.from(formData.keys ? formData.keys() : []));
      
      // For React Native, send as JSON instead of FormData
      const jsonPayload = {};
      
      // Extract data from FormData
      if (formData && formData._parts) {
        // React Native FormData has _parts array
        formData._parts.forEach(([key, value]) => {
          if (key === 'image' && typeof value === 'object' && value.uri) {
            // Convert file:// URI to base64 if possible
            console.log('📤 Processing image URI:', value.uri);
            
            // For React Native, we need to handle the image differently
            // If it's a local file URI, we'll include it as-is and let the backend handle it
            jsonPayload[key] = {
              uri: value.uri,
              type: value.type || 'image/jpeg',
              name: value.name || 'image.jpg',
              size: value.size || 0
            };
          } else {
            jsonPayload[key] = value;
          }
        });
      } else {
        // Fallback: assume formData is already an object
        Object.assign(jsonPayload, formData);
      }
      
      console.log('📤 Sending JSON payload with keys:', Object.keys(jsonPayload));
      console.log('📤 Image payload details:', jsonPayload.image);
      
      const response = await client.post(endpoint, jsonPayload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 seconds for file uploads
        maxContentLength: 50 * 1024 * 1024, // 50MB
        maxBodyLength: 50 * 1024 * 1024, // 50MB
      });
      
      console.log('📤 Upload successful, response:', response.data);
      return response.data;
    } catch (error) {
      console.error('📤 Add image to crop error:', error);
      if (error.response) {
        console.error('📤 Error response data:', error.response.data);
        console.error('📤 Error response status:', error.response.status);
        console.error('📤 Error response headers:', error.response.headers);
      } else if (error.request) {
        console.error('📤 Error request config:', {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          headers: error.config?.headers,
          timeout: error.config?.timeout
        });
      } else {
        console.error('📤 Setup error:', error.message);
      }
      
      // Provide more specific error messages
      if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
        throw new Error('Network connection failed. Please check your internet connection and try again.');
      } else if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
        throw new Error('Upload timed out. Please try uploading a smaller image.');
      } else {
        throw new Error('Failed to add image to crop');
      }
    }
  }

  /**
   * Get crop images
   */
  async getCropImages(cropId: string): Promise<ApiResponse<any[]>> {
    try {
      const client = await getApiClient();
      const response = await client.get(`/crops/${cropId}/images`);
      return response.data;
    } catch (error) {
      console.error('Get crop images error:', error);
      throw new Error('Failed to get crop images');
    }
  }

  /**
   * Delete crop image
   */
  async deleteCropImage(cropId: string, imageId: string): Promise<ApiResponse<any>> {
    try {
      const client = await getApiClient();
      const response = await client.delete(`/crops/${cropId}/images/${imageId}`);
      return response.data;
    } catch (error) {
      console.error('Delete crop image error:', error);
      throw new Error('Failed to delete crop image');
    }
  }

  /**
   * Get full URL for relative image path
   */
  getImageUrl(relativePath: string): string {
    if (relativePath.startsWith('http')) {
      return relativePath; // Already a full URL
    }
    
    // Remove leading slash if present
    const cleanPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
    
    // Get the base URL from the initialized client, but remove /api for images
    let baseURL = apiClient?.defaults.baseURL || 'http://localhost:3000';
    
    // Images are served from root, not from /api, so remove /api if present
    if (baseURL.endsWith('/api')) {
      baseURL = baseURL.slice(0, -4);
    }
    
    return `${baseURL}/${cleanPath}`;
  }

  // ===== ACTIVITY MANAGEMENT APIs =====

  /**
   * Get crop activities
   */
  async getCropActivities(cropId: string): Promise<ApiResponse<any[]>> {
    try {
      const client = await getApiClient();
      const response = await client.get(`/crops/${cropId}/activities`);
      return response.data;
    } catch (error) {
      console.error('Get crop activities error:', error);
      throw new Error('Failed to get crop activities');
    }
  }

  /**
   * Add activity to crop
   */
  async addCropActivity(cropId: string, activityData: {
    type: string;
    title: string;
    description?: string;
    date?: string;
    metadata?: any;
    images?: string[];
    createdBy?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const client = await getApiClient();
      const response = await client.post(`/crops/${cropId}/activities`, activityData);
      return response.data;
    } catch (error) {
      console.error('Add crop activity error:', error);
      throw new Error('Failed to add crop activity');
    }
  }

  /**
   * Update crop activity
   */
  async updateCropActivity(cropId: string, activityId: string, updates: any): Promise<ApiResponse<any>> {
    try {
      const client = await getApiClient();
      const response = await client.put(`/crops/${cropId}/activities/${activityId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Update crop activity error:', error);
      throw new Error('Failed to update crop activity');
    }
  }

  /**
   * Delete crop activity
   */
  async deleteCropActivity(cropId: string, activityId: string): Promise<ApiResponse<any>> {
    try {
      const client = await getApiClient();
      const response = await client.delete(`/crops/${cropId}/activities/${activityId}`);
      return response.data;
    } catch (error) {
      console.error('Delete crop activity error:', error);
      throw new Error('Failed to delete crop activity');
    }
  }

  // ===== GENERIC REQUEST METHODS =====
  
  async get(url: string, config?: any) {
    const client = await getApiClient();
    return client.get(url, config);
  }
  
  async post(url: string, data?: any, config?: any) {
    const client = await getApiClient();
    return client.post(url, data, config);
  }
  
  async put(url: string, data?: any, config?: any) {
    const client = await getApiClient();
    return client.put(url, data, config);
  }
  
  async delete(url: string, config?: any) {
    const client = await getApiClient();
    return client.delete(url, config);
  }
}

export default new ApiService();
