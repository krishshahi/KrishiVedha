/**
 * Dynamic Configuration System for KrishiVedha Client
 * This replaces all hardcoded values with configurable options
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration keys for AsyncStorage
const CONFIG_KEYS = {
  THEME: '@krishivedha/theme',
  LANGUAGE: '@krishivedha/language',
  USER_PREFERENCES: '@krishivedha/user_preferences',
  API_SETTINGS: '@krishivedha/api_settings',
  FEATURE_FLAGS: '@krishivedha/feature_flags',
};

// Default configuration that can be overridden
const DEFAULT_CONFIG = {
  app: {
    name: 'KrishiVedha',
    version: '1.0.0',
    environment: __DEV__ ? 'development' : 'production',
  },
  
  api: {
    baseUrl: Constants.expoConfig?.extra?.REACT_NATIVE_API_URL || 'http://localhost:3000/api',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  
  network: {
    enableAutoDetection: true,
    fallbackUrls: [
      'http://localhost:3000/api',
      'http://192.168.1.1:3000/api',
      'http://10.0.0.1:3000/api',
    ],
    connectionTimeout: 5000,
    maxRetries: 3,
  },
  
  ui: {
    theme: {
      mode: 'auto', // 'light', 'dark', 'auto'
      primaryColor: '#4CAF50',
      secondaryColor: '#FFC107',
      accentColor: '#2196F3',
    },
    
    layout: {
      headerHeight: Platform.select({ ios: 88, android: 64, default: 64 }),
      tabBarHeight: Platform.select({ ios: 83, android: 56, default: 56 }),
      borderRadius: {
        small: 4,
        medium: 8,
        large: 12,
        extraLarge: 16,
      },
      spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
      },
    },
    
    typography: {
      fontSizes: {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 20,
        xxl: 24,
        xxxl: 30,
      },
      fontWeights: {
        light: '300',
        regular: '400',
        medium: '500',
        bold: '700',
      },
      lineHeights: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
      },
    },
    
    animations: {
      duration: {
        fast: 200,
        normal: 300,
        slow: 500,
      },
      easing: 'ease-in-out',
    },
  },
  
  features: {
    enableWeather: true,
    enableCommunity: true,
    enableAI: false,
    enableIoT: false,
    enableAnalytics: true,
    enableNotifications: true,
    enableOfflineMode: true,
    enableDebugMode: __DEV__,
  },
  
  localization: {
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'ne', 'hi'],
    enableRTL: false,
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h', // '12h' or '24h'
    numberFormat: 'en-US',
  },
  
  storage: {
    enableCache: true,
    cacheTimeout: 300000, // 5 minutes
    maxCacheSize: 50 * 1024 * 1024, // 50MB
    enableEncryption: false,
  },
  
  media: {
    imageQuality: 0.8,
    maxImageSize: 5 * 1024 * 1024, // 5MB
    allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    compressionEnabled: true,
  },
  
  notifications: {
    enablePush: true,
    enableLocal: true,
    categories: {
      weather: true,
      crops: true,
      community: true,
      system: true,
    },
  },
  
  analytics: {
    enableCrashReporting: !__DEV__,
    enableUsageTracking: !__DEV__,
    enablePerformanceMonitoring: true,
  },
  
  accessibility: {
    enableScreenReader: true,
    enableHighContrast: false,
    enableLargeText: false,
    enableReducedMotion: false,
  },
};

class DynamicConfigManager {
  private static instance: DynamicConfigManager;
  private config: typeof DEFAULT_CONFIG;
  private listeners: Array<(config: typeof DEFAULT_CONFIG) => void> = [];
  
  private constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.initialize();
  }
  
  public static getInstance(): DynamicConfigManager {
    if (!DynamicConfigManager.instance) {
      DynamicConfigManager.instance = new DynamicConfigManager();
    }
    return DynamicConfigManager.instance;
  }
  
  private async initialize() {
    try {
      // Load saved configurations from AsyncStorage
      await this.loadSavedConfig();
      
      // Apply environment-specific overrides
      this.applyEnvironmentOverrides();
      
      // Validate configuration
      this.validateConfig();
      
      console.log('🔧 Dynamic configuration initialized:', {
        environment: this.config.app.environment,
        apiUrl: this.config.api.baseUrl,
        features: Object.keys(this.config.features).filter(key => 
          this.config.features[key as keyof typeof this.config.features]
        ),
      });
    } catch (error) {
      console.warn('⚠️ Failed to initialize dynamic config:', error);
    }
  }
  
  private async loadSavedConfig() {
    try {
      const savedConfigs = await Promise.all([
        AsyncStorage.getItem(CONFIG_KEYS.THEME),
        AsyncStorage.getItem(CONFIG_KEYS.LANGUAGE),
        AsyncStorage.getItem(CONFIG_KEYS.USER_PREFERENCES),
        AsyncStorage.getItem(CONFIG_KEYS.API_SETTINGS),
        AsyncStorage.getItem(CONFIG_KEYS.FEATURE_FLAGS),
      ]);
      
      const [theme, language, userPrefs, apiSettings, featureFlags] = savedConfigs;
      
      if (theme) {
        this.config.ui.theme = { ...this.config.ui.theme, ...JSON.parse(theme) };
      }
      
      if (language) {
        this.config.localization.defaultLanguage = JSON.parse(language);
      }
      
      if (userPrefs) {
        const prefs = JSON.parse(userPrefs);
        this.config.ui = { ...this.config.ui, ...prefs.ui };
        this.config.accessibility = { ...this.config.accessibility, ...prefs.accessibility };
      }
      
      if (apiSettings) {
        this.config.api = { ...this.config.api, ...JSON.parse(apiSettings) };
      }
      
      if (featureFlags) {
        this.config.features = { ...this.config.features, ...JSON.parse(featureFlags) };
      }
    } catch (error) {
      console.warn('⚠️ Failed to load saved config:', error);
    }
  }
  
  private applyEnvironmentOverrides() {
    // Production overrides
    if (this.config.app.environment === 'production') {
      this.config.features.enableDebugMode = false;
      this.config.analytics.enableCrashReporting = true;
      this.config.analytics.enableUsageTracking = true;
    }
    
    // Development overrides
    if (this.config.app.environment === 'development') {
      this.config.network.connectionTimeout = 10000; // Longer timeout for dev
      this.config.api.retryAttempts = 1; // Fewer retries for faster debugging
    }
    
    // Platform-specific overrides
    if (Platform.OS === 'ios') {
      this.config.ui.layout.headerHeight = 88;
      this.config.ui.layout.tabBarHeight = 83;
    } else if (Platform.OS === 'android') {
      this.config.ui.layout.headerHeight = 64;
      this.config.ui.layout.tabBarHeight = 56;
    }
  }
  
  private validateConfig() {
    const errors: string[] = [];
    
    if (!this.config.api.baseUrl) {
      errors.push('API base URL is required');
    }
    
    if (this.config.api.timeout <= 0) {
      errors.push('API timeout must be greater than 0');
    }
    
    if (this.config.media.maxImageSize <= 0) {
      errors.push('Max image size must be greater than 0');
    }
    
    if (errors.length > 0) {
      console.warn('⚠️ Configuration validation warnings:', errors);
    }
  }
  
  // Public methods
  public getConfig(): typeof DEFAULT_CONFIG {
    return { ...this.config };
  }
  
  public updateConfig(updates: Partial<typeof DEFAULT_CONFIG>): void {
    this.config = this.mergeDeep(this.config, updates);
    this.notifyListeners();
    this.saveConfig();
  }
  
  public resetConfig(): void {
    this.config = { ...DEFAULT_CONFIG };
    this.applyEnvironmentOverrides();
    this.notifyListeners();
    this.clearSavedConfig();
  }
  
  public subscribe(listener: (config: typeof DEFAULT_CONFIG) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.config));
  }
  
  private async saveConfig(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(CONFIG_KEYS.THEME, JSON.stringify(this.config.ui.theme)),
        AsyncStorage.setItem(CONFIG_KEYS.LANGUAGE, JSON.stringify(this.config.localization.defaultLanguage)),
        AsyncStorage.setItem(CONFIG_KEYS.API_SETTINGS, JSON.stringify(this.config.api)),
        AsyncStorage.setItem(CONFIG_KEYS.FEATURE_FLAGS, JSON.stringify(this.config.features)),
      ]);
    } catch (error) {
      console.warn('⚠️ Failed to save config:', error);
    }
  }
  
  private async clearSavedConfig(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(CONFIG_KEYS));
    } catch (error) {
      console.warn('⚠️ Failed to clear saved config:', error);
    }
  }
  
  private mergeDeep(target: any, source: any): any {
    const output = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        output[key] = this.mergeDeep(target[key] || {}, source[key]);
      } else {
        output[key] = source[key];
      }
    }
    
    return output;
  }
}

// Singleton instance
export const configManager = DynamicConfigManager.getInstance();

// Convenience functions
export const getConfig = () => configManager.getConfig();
export const updateConfig = (updates: Partial<typeof DEFAULT_CONFIG>) => configManager.updateConfig(updates);
export const subscribeToConfig = (listener: (config: typeof DEFAULT_CONFIG) => void) => 
  configManager.subscribe(listener);

export default configManager;
