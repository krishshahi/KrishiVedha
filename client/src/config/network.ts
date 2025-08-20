import Constants from 'expo-constants';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

/**
 * Network configuration for different environments and devices
 */

// Cache for IP address to avoid repeated network calls
let cachedIP: string | null = null;
let lastIPCheck: number = 0;
const IP_CACHE_DURATION = 30000; // 30 seconds

// Get the current network IP address dynamically
const getCurrentIP = async (): Promise<string> => {
  const now = Date.now();
  
  // Return cached IP if it's still valid
  if (cachedIP && (now - lastIPCheck) < IP_CACHE_DURATION) {
    return cachedIP;
  }

  try {
    // Get network state information
    const netInfo = await NetInfo.fetch();
    
    if (netInfo.isConnected && netInfo.details) {
      // For WiFi connections, try to get the IP address
      if (netInfo.type === 'wifi' && 'ipAddress' in netInfo.details && netInfo.details.ipAddress) {
        // Extract the base IP for the development server
        const deviceIP = netInfo.details.ipAddress as string;
        console.log('📱 Device IP detected:', deviceIP);
        
        // For development, assume the server is on the same network with .1 or use the device IP
        // You can modify this logic based on your server setup
        const ipParts = deviceIP.split('.');
        if (ipParts.length === 4) {
          // Try common development server IPs
          const baseIP = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}`;
          const possibleServerIPs = [
            `${baseIP}.1`,    // Router/Gateway IP (common for dev servers)
            deviceIP,        // Same as device IP
            `${baseIP}.100`, // Common static IP
          ];
          
          // For now, use the device IP as the server IP
          // You can enhance this with actual server discovery
          cachedIP = deviceIP;
          lastIPCheck = now;
          return cachedIP;
        }
      }
      
      // For other connection types, try to extract IP if available
      if ('ipAddress' in netInfo.details && netInfo.details.ipAddress) {
        cachedIP = netInfo.details.ipAddress as string;
        lastIPCheck = now;
        return cachedIP;
      }
    }
  } catch (error) {
    console.warn('🔍 Failed to detect network IP:', error);
  }

  // Fallback to checking expo config or default IPs
  if (Constants.expoConfig?.extra?.REACT_NATIVE_API_URL) {
    const url = Constants.expoConfig.extra.REACT_NATIVE_API_URL as string;
    const match = url.match(/http:\/\/([^:]+)/);
    if (match && match[1]) {
      cachedIP = match[1];
      lastIPCheck = now;
      return cachedIP;
    }
  }

  // Final fallback to common development IPs
  const fallbackIPs = [
    '192.168.1.1',   // Common home router IP
    '192.168.0.1',   // Another common router IP
    '10.0.0.1',      // Corporate network
    '172.16.0.1',    // Private network
    'localhost'      // Local development
  ];
  
  cachedIP = fallbackIPs[0];
  lastIPCheck = now;
  console.warn('⚠️ Using fallback IP:', cachedIP);
  return cachedIP;
};

// Android Emulator uses 10.0.2.2 to access host machine
const getAndroidEmulatorIP = (): string => {
  return '10.0.2.2';
};

// Physical devices use the actual network IP
const getPhysicalDeviceIP = async (): Promise<string> => {
  return await getCurrentIP();
};

// Determine the correct API base URL based on platform and environment
export const getApiBaseUrl = async (): Promise<string> => {
  // First check if we have a configured URL in app.json
  if (Constants.expoConfig?.extra?.REACT_NATIVE_API_URL) {
    const configuredUrl = Constants.expoConfig.extra.REACT_NATIVE_API_URL as string;
    console.log('🎯 getApiBaseUrl using configured URL:', configuredUrl);
    return configuredUrl;
  }
  
  // Fallback to auto-detected IP
  const baseIP = await getCurrentIP();
  const port = '3000';
  const apiUrl = `http://${baseIP}:${port}/api`;
  console.log('📡 getApiBaseUrl using auto-detected IP:', apiUrl);
  return apiUrl;
};

// Get current network configuration dynamically
export const getNetworkConfig = async () => {
  const currentIP = await getCurrentIP();
  
  return {
    // Development URLs
    development: {
      localhost: 'http://localhost:3000/api',
      currentIP: `http://${currentIP}:3000/api`,
      androidEmulator: `http://${getAndroidEmulatorIP()}:3000/api`,
      tunnelUrl: '', // Will be populated by Expo tunnel if used
    },
    
    // Production URLs (update these for your production environment)
    production: {
      api: 'https://your-production-api.com/api',
    },
    
    // Network timeouts and retry configuration
    timeouts: {
      request: 10000, // 10 seconds
      response: 10000, // 10 seconds
      retryAttempts: 3,
      retryDelay: 1000, // 1 second
    },
    
    // Network status checking
    healthCheck: {
      endpoint: '/health',
      interval: 30000, // 30 seconds
      timeout: 5000, // 5 seconds
    },
  };
};

// Configuration for different network scenarios (static version for backwards compatibility)
export const NetworkConfig = {
  // Development URLs
  development: {
    localhost: 'http://localhost:3000/api',
    currentIP: 'http://dynamic-ip:3000/api', // Placeholder - use getNetworkConfig() for actual IP
    androidEmulator: `http://${getAndroidEmulatorIP()}:3000/api`,
    tunnelUrl: '', // Will be populated by Expo tunnel if used
  },
  
  // Production URLs (update these for your production environment)
  production: {
    api: 'https://your-production-api.com/api',
  },
  
  // Network timeouts and retry configuration
  timeouts: {
    request: 10000, // 10 seconds
    response: 10000, // 10 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
  },
  
  // Network status checking
  healthCheck: {
    endpoint: '/health',
    interval: 30000, // 30 seconds
    timeout: 5000, // 5 seconds
  },
};

// Helper function to test network connectivity
export const testNetworkConnectivity = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(`${url}/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    console.error('Network connectivity test failed:', error);
    return false;
  }
};

// Auto-detect the best API URL
export const autoDetectApiUrl = async (): Promise<string> => {
  // First priority: Use configured URL from app.json if available (NO TESTING)
  if (Constants.expoConfig?.extra?.REACT_NATIVE_API_URL) {
    const configuredUrl = Constants.expoConfig.extra.REACT_NATIVE_API_URL as string;
    console.log('🎯 Using configured API URL from app.json:', configuredUrl);
    return configuredUrl;
  }
  
  console.log('📍 No configured URL found, using network auto-detection...');
  
  const networkConfig = await getNetworkConfig();
  
  // For React Native, localhost doesn't work from mobile devices
  // We need to use the actual network IP or emulator-specific IPs
  const urls = [];
  
  // Try detected network IP and emulator IP
  urls.push(
    networkConfig.development.currentIP,     // Auto-detected network IP
    networkConfig.development.androidEmulator, // Android emulator specific IP
    networkConfig.development.localhost      // Localhost (fallback)
  );
  
  console.log('🔍 Testing network connectivity for URLs:', urls);
  
  for (const url of urls) {
    console.log(`Testing connectivity to: ${url}`);
    const isConnected = await testNetworkConnectivity(url);
    if (isConnected) {
      console.log(`✅ Network auto-detection: Using ${url}`);
      return url;
    }
  }
  
  console.warn('⚠️ Network auto-detection failed, using default URL');
  return await getApiBaseUrl();
};

// Network troubleshooting information
export const NetworkTroubleshooting = {
  commonIssues: [
    'Backend server not running on port 3000',
    'Firewall blocking network connections',
    'Incorrect IP address configuration',
    'WiFi network changed, IP address updated',
    'Android emulator vs physical device network differences',
  ],
  
  solutions: [
    'Run: node backend/server.js',
    'Add firewall rules for ports 3000 and 8081',
    'Update IP addresses in app.json, .env, and apiService.ts',
    'Restart development server after network changes',
    'Use 10.0.2.2 for Android emulator, actual IP for physical devices',
  ],
  
  testCommands: [
    'curl http://10.0.0.99:3000/api/health',
    'netstat -an | findstr :3000',
    'ipconfig | findstr IPv4',
    'ping 10.0.0.99',
  ],
};

export default {
  getApiBaseUrl,
  NetworkConfig,
  testNetworkConnectivity,
  autoDetectApiUrl,
  NetworkTroubleshooting,
};
