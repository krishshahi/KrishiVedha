import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import * as Notifications from 'expo-notifications';

// Storage keys
const STORAGE_KEYS = {
  THEME_SETTINGS: '@krishivedha_theme_settings',
  NOTIFICATION_SETTINGS: '@krishivedha_notification_settings',
  DATA_SETTINGS: '@krishivedha_data_settings',
  REGIONAL_SETTINGS: '@krishivedha_regional_settings',
  PRIVACY_SETTINGS: '@krishivedha_privacy_settings',
  ACCESSIBILITY_SETTINGS: '@krishivedha_accessibility_settings',
  APP_PREFERENCES: '@krishivedha_app_preferences',
};

// Settings interfaces
export interface NotificationSettings {
  enabled: boolean;
  cropAlerts: boolean;
  weatherUpdates: boolean;
  marketPrices: boolean;
  communityActivity: boolean;
  newsletter: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

export interface DataSettings {
  autoSync: boolean;
  wifiOnly: boolean;
  compressImages: boolean;
  cacheSize: string;
  backupEnabled: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  cloudProvider: 'google' | 'dropbox' | 'onedrive' | 'none';
  offlineMode: boolean;
  dataRetention: number; // days
}

export interface RegionalSettings {
  language: string;
  country: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  units: {
    temperature: 'celsius' | 'fahrenheit';
    area: 'hectares' | 'acres' | 'sqmeters';
    weight: 'kg' | 'lbs' | 'tons';
    distance: 'km' | 'miles';
    volume: 'liters' | 'gallons';
  };
  firstDayOfWeek: number; // 0 = Sunday, 1 = Monday
}

export interface PrivacySettings {
  shareAnalytics: boolean;
  shareLocation: boolean;
  publicProfile: boolean;
  showOnlineStatus: boolean;
  allowMessages: boolean;
  dataCollection: boolean;
  personalizedAds: boolean;
  crashReporting: boolean;
}

export interface AccessibilitySettings {
  reduceMotion: boolean;
  increaseContrast: boolean;
  screenReader: boolean;
  hapticFeedback: boolean;
  soundEffects: boolean;
  voiceControl: boolean;
  magnification: number;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
}

export interface AppPreferences {
  defaultScreen: string;
  showTutorials: boolean;
  autoPlayVideos: boolean;
  downloadOverWifi: boolean;
  keepScreenOn: boolean;
  developerMode: boolean;
  experimentalFeatures: boolean;
  betaProgram: boolean;
}

class SettingsService {
  private static instance: SettingsService;

  private constructor() {}

  static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  // Initialize settings with defaults
  async initializeSettings(): Promise<void> {
    console.log('🔧 Initializing settings service...');
    
    try {
      // Check if settings exist, if not create defaults
      const existingSettings = await this.getAllSettings();
      
      if (!existingSettings.notifications) {
        await this.saveNotificationSettings(this.getDefaultNotificationSettings());
      }
      
      if (!existingSettings.data) {
        await this.saveDataSettings(this.getDefaultDataSettings());
      }
      
      if (!existingSettings.regional) {
        await this.saveRegionalSettings(await this.getDefaultRegionalSettings());
      }
      
      if (!existingSettings.privacy) {
        await this.savePrivacySettings(this.getDefaultPrivacySettings());
      }
      
      if (!existingSettings.accessibility) {
        await this.saveAccessibilitySettings(this.getDefaultAccessibilitySettings());
      }
      
      if (!existingSettings.preferences) {
        await this.saveAppPreferences(this.getDefaultAppPreferences());
      }
      
      console.log('✅ Settings service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize settings:', error);
    }
  }

  // Get all settings
  async getAllSettings(): Promise<{
    notifications?: NotificationSettings;
    data?: DataSettings;
    regional?: RegionalSettings;
    privacy?: PrivacySettings;
    accessibility?: AccessibilitySettings;
    preferences?: AppPreferences;
  }> {
    try {
      const [notifications, data, regional, privacy, accessibility, preferences] = await Promise.all([
        this.getNotificationSettings(),
        this.getDataSettings(),
        this.getRegionalSettings(),
        this.getPrivacySettings(),
        this.getAccessibilitySettings(),
        this.getAppPreferences(),
      ]);

      return {
        notifications,
        data,
        regional,
        privacy,
        accessibility,
        preferences,
      };
    } catch (error) {
      console.error('Error getting all settings:', error);
      return {};
    }
  }

  // Notification Settings
  async getNotificationSettings(): Promise<NotificationSettings | null> {
    try {
      const settings = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return null;
    }
  }

  async saveNotificationSettings(settings: NotificationSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, JSON.stringify(settings));
      
      // Apply notification settings
      if (settings.enabled && settings.pushEnabled) {
        await this.enablePushNotifications();
      } else {
        await this.disablePushNotifications();
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }

  // Data Settings
  async getDataSettings(): Promise<DataSettings | null> {
    try {
      const settings = await AsyncStorage.getItem(STORAGE_KEYS.DATA_SETTINGS);
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      console.error('Error getting data settings:', error);
      return null;
    }
  }

  async saveDataSettings(settings: DataSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DATA_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving data settings:', error);
    }
  }

  // Regional Settings
  async getRegionalSettings(): Promise<RegionalSettings | null> {
    try {
      const settings = await AsyncStorage.getItem(STORAGE_KEYS.REGIONAL_SETTINGS);
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      console.error('Error getting regional settings:', error);
      return null;
    }
  }

  async saveRegionalSettings(settings: RegionalSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REGIONAL_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving regional settings:', error);
    }
  }

  // Privacy Settings
  async getPrivacySettings(): Promise<PrivacySettings | null> {
    try {
      const settings = await AsyncStorage.getItem(STORAGE_KEYS.PRIVACY_SETTINGS);
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      console.error('Error getting privacy settings:', error);
      return null;
    }
  }

  async savePrivacySettings(settings: PrivacySettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PRIVACY_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving privacy settings:', error);
    }
  }

  // Accessibility Settings
  async getAccessibilitySettings(): Promise<AccessibilitySettings | null> {
    try {
      const settings = await AsyncStorage.getItem(STORAGE_KEYS.ACCESSIBILITY_SETTINGS);
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      console.error('Error getting accessibility settings:', error);
      return null;
    }
  }

  async saveAccessibilitySettings(settings: AccessibilitySettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESSIBILITY_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving accessibility settings:', error);
    }
  }

  // App Preferences
  async getAppPreferences(): Promise<AppPreferences | null> {
    try {
      const settings = await AsyncStorage.getItem(STORAGE_KEYS.APP_PREFERENCES);
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      console.error('Error getting app preferences:', error);
      return null;
    }
  }

  async saveAppPreferences(preferences: AppPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.APP_PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving app preferences:', error);
    }
  }

  // Clear all settings
  async clearAllSettings(): Promise<void> {
    try {
      await Promise.all(
        Object.values(STORAGE_KEYS).map(key => AsyncStorage.removeItem(key))
      );
      console.log('✅ All settings cleared');
    } catch (error) {
      console.error('Error clearing settings:', error);
    }
  }

  // Export settings
  async exportSettings(): Promise<string> {
    try {
      const allSettings = await this.getAllSettings();
      return JSON.stringify(allSettings, null, 2);
    } catch (error) {
      console.error('Error exporting settings:', error);
      throw error;
    }
  }

  // Import settings
  async importSettings(settingsJson: string): Promise<void> {
    try {
      const settings = JSON.parse(settingsJson);
      
      if (settings.notifications) {
        await this.saveNotificationSettings(settings.notifications);
      }
      
      if (settings.data) {
        await this.saveDataSettings(settings.data);
      }
      
      if (settings.regional) {
        await this.saveRegionalSettings(settings.regional);
      }
      
      if (settings.privacy) {
        await this.savePrivacySettings(settings.privacy);
      }
      
      if (settings.accessibility) {
        await this.saveAccessibilitySettings(settings.accessibility);
      }
      
      if (settings.preferences) {
        await this.saveAppPreferences(settings.preferences);
      }
      
      console.log('✅ Settings imported successfully');
    } catch (error) {
      console.error('Error importing settings:', error);
      throw error;
    }
  }

  // Cache management
  async clearCache(): Promise<void> {
    try {
      const cacheKeys = [
        '@krishivedha_image_cache',
        '@krishivedha_weather_cache',
        '@krishivedha_ml_analysis',
        '@krishivedha_api_cache',
      ];
      
      await Promise.all(cacheKeys.map(key => AsyncStorage.removeItem(key)));
      console.log('✅ Cache cleared successfully');
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }

  async getCacheSize(): Promise<string> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.includes('cache'));
      
      let totalSize = 0;
      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }
      
      // Convert to human-readable format
      if (totalSize < 1024) {
        return `${totalSize} B`;
      } else if (totalSize < 1024 * 1024) {
        return `${(totalSize / 1024).toFixed(1)} KB`;
      } else {
        return `${(totalSize / (1024 * 1024)).toFixed(1)} MB`;
      }
    } catch (error) {
      console.error('Error calculating cache size:', error);
      return '0 B';
    }
  }

  // Default settings
  private getDefaultNotificationSettings(): NotificationSettings {
    return {
      enabled: true,
      cropAlerts: true,
      weatherUpdates: true,
      marketPrices: false,
      communityActivity: true,
      newsletter: false,
      pushEnabled: true,
      emailEnabled: true,
      smsEnabled: false,
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '07:00',
      },
    };
  }

  private getDefaultDataSettings(): DataSettings {
    return {
      autoSync: true,
      wifiOnly: false,
      compressImages: true,
      cacheSize: '100MB',
      backupEnabled: true,
      backupFrequency: 'weekly',
      cloudProvider: 'none',
      offlineMode: false,
      dataRetention: 365,
    };
  }

  private async getDefaultRegionalSettings(): Promise<RegionalSettings> {
    const locale = Localization.locale;
    const timezone = Localization.timezone;
    
    return {
      language: locale.split('-')[0] || 'en',
      country: locale.split('-')[1] || 'US',
      timezone: timezone || 'UTC',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      units: {
        temperature: 'celsius',
        area: 'hectares',
        weight: 'kg',
        distance: 'km',
        volume: 'liters',
      },
      firstDayOfWeek: 0,
    };
  }

  private getDefaultPrivacySettings(): PrivacySettings {
    return {
      shareAnalytics: true,
      shareLocation: false,
      publicProfile: false,
      showOnlineStatus: true,
      allowMessages: true,
      dataCollection: true,
      personalizedAds: false,
      crashReporting: true,
    };
  }

  private getDefaultAccessibilitySettings(): AccessibilitySettings {
    return {
      reduceMotion: false,
      increaseContrast: false,
      screenReader: false,
      hapticFeedback: true,
      soundEffects: true,
      voiceControl: false,
      magnification: 1.0,
      colorBlindMode: 'none',
    };
  }

  private getDefaultAppPreferences(): AppPreferences {
    return {
      defaultScreen: 'Dashboard',
      showTutorials: true,
      autoPlayVideos: true,
      downloadOverWifi: true,
      keepScreenOn: false,
      developerMode: false,
      experimentalFeatures: false,
      betaProgram: false,
    };
  }

  // Push notification helpers
  private async enablePushNotifications(): Promise<void> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        console.log('✅ Push notifications enabled');
      }
    } catch (error) {
      console.error('Error enabling push notifications:', error);
    }
  }

  private async disablePushNotifications(): Promise<void> {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MIN,
        sound: null,
        vibrationPattern: null,
        enableVibrate: false,
      });
      console.log('✅ Push notifications disabled');
    } catch (error) {
      console.error('Error disabling push notifications:', error);
    }
  }

  // Unit conversion helpers
  convertTemperature(value: number, from: 'celsius' | 'fahrenheit', to: 'celsius' | 'fahrenheit'): number {
    if (from === to) return value;
    if (from === 'celsius') {
      return (value * 9/5) + 32; // Celsius to Fahrenheit
    } else {
      return (value - 32) * 5/9; // Fahrenheit to Celsius
    }
  }

  convertArea(value: number, from: string, to: string): number {
    const conversions = {
      'hectares': { 'acres': 2.47105, 'sqmeters': 10000 },
      'acres': { 'hectares': 0.404686, 'sqmeters': 4046.86 },
      'sqmeters': { 'hectares': 0.0001, 'acres': 0.000247105 },
    };
    
    if (from === to) return value;
    return value * (conversions[from]?.[to] || 1);
  }

  convertWeight(value: number, from: string, to: string): number {
    const conversions = {
      'kg': { 'lbs': 2.20462, 'tons': 0.001 },
      'lbs': { 'kg': 0.453592, 'tons': 0.000453592 },
      'tons': { 'kg': 1000, 'lbs': 2204.62 },
    };
    
    if (from === to) return value;
    return value * (conversions[from]?.[to] || 1);
  }

  convertDistance(value: number, from: string, to: string): number {
    const conversions = {
      'km': { 'miles': 0.621371 },
      'miles': { 'km': 1.60934 },
    };
    
    if (from === to) return value;
    return value * (conversions[from]?.[to] || 1);
  }

  convertVolume(value: number, from: string, to: string): number {
    const conversions = {
      'liters': { 'gallons': 0.264172 },
      'gallons': { 'liters': 3.78541 },
    };
    
    if (from === to) return value;
    return value * (conversions[from]?.[to] || 1);
  }
}

// Export singleton instance
export const settingsService = SettingsService.getInstance();
export default settingsService;
