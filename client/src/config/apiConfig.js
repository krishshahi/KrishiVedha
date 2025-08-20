import { getApiBaseUrl, autoDetectApiUrl } from './network';

// Simple API configuration object
export const apiConfig = {
  // Default base URL - will be overridden by dynamic detection
  baseURL: 'http://192.168.1.129:3000/api',
  
  // Timeout configurations
  timeout: 10000, // 10 seconds
  
  // Retry configuration
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  
  // Endpoints
  endpoints: {
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      logout: '/auth/logout',
      refresh: '/auth/refresh',
      verify: '/auth/verify',
      resetPassword: '/auth/reset-password',
      changePassword: '/auth/change-password',
      profile: '/auth/profile'
    },
    users: {
      profile: '/users',
      delete: '/users'
    },
    health: '/health'
  }
};

// Initialize dynamic base URL
let dynamicBaseURL = null;

// Function to get the current base URL (with dynamic detection)
export const getBaseURL = async () => {
  if (!dynamicBaseURL) {
    try {
      dynamicBaseURL = await autoDetectApiUrl();
      apiConfig.baseURL = dynamicBaseURL;
      console.log('🔧 API Config: Base URL updated to:', dynamicBaseURL);
    } catch (error) {
      console.warn('⚠️ API Config: Failed to auto-detect URL, using default:', apiConfig.baseURL);
      dynamicBaseURL = apiConfig.baseURL;
    }
  }
  return dynamicBaseURL;
};

// Initialize the base URL when the module loads
getBaseURL().catch(error => {
  console.warn('API Config initialization warning:', error);
});

export default apiConfig;
