import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';
// Firebase messaging will be added later when properly configured
// import messaging from '@react-native-firebase/messaging';
// import notifee, { AndroidImportance, AndroidVisibility } from '@notifee/react-native';
// import { apiService } from './apiService';

export interface NotificationSettings {
  weatherAlerts: boolean;
  activityReminders: boolean;
  harvestReminders: boolean;
  communityUpdates: boolean;
  marketUpdates: boolean;
  systemNotifications: boolean;
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  data?: any;
  type: 'weather' | 'activity' | 'harvest' | 'community' | 'market' | 'system';
  priority: 'low' | 'normal' | 'high';
  scheduledTime?: Date;
  read: boolean;
  createdAt: Date;
}

class PushNotificationService {
  private initialized = false;
  private fcmToken: string | null = null;
  private unsubscribeTokenRefresh?: () => void;
  private unsubscribeOnMessage?: () => void;
  private unsubscribeOnNotificationOpened?: () => void;

  // Default notification settings
  private defaultSettings: NotificationSettings = {
    weatherAlerts: true,
    activityReminders: true,
    harvestReminders: true,
    communityUpdates: true,
    marketUpdates: false,
    systemNotifications: true,
  };

  /**
   * Initialize the push notification service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🔔 Initializing Push Notification Service...');
      console.log('⚠️ Firebase messaging is not configured. Using local notifications only.');

      // For now, just mark as initialized
      // Firebase and Notifee integration will be added when properly configured
      this.initialized = true;
      console.log('✅ Push Notification Service initialized (simplified mode)');
    } catch (error) {
      console.error('❌ Failed to initialize Push Notification Service:', error);
      // Don't throw - allow app to continue without notifications
    }
  }

  /**
   * Request notification permissions
   */
  private async requestPermissions(): Promise<void> {
    // Firebase messaging not configured - skip permissions for now
    console.log('⚠️ Notification permissions not requested (Firebase not configured)');
  }

  /**
   * Initialize Notifee for local notifications
   */
  private async initializeNotifee(): Promise<void> {
    // Notifee not configured - skip initialization
    console.log('⚠️ Notifee not initialized (not configured)');
  }

  /**
   * Get FCM token
   */
  private async getFCMToken(): Promise<void> {
    // Firebase messaging not configured - skip FCM token
    console.log('⚠️ FCM Token not obtained (Firebase not configured)');
  }

  /**
   * Setup message listeners for FCM (disabled - Firebase not configured)
   */
  private setupMessageListeners(): void {
    console.log('⚠️ Message listeners not setup (Firebase not configured)');
    // Firebase messaging setup will be implemented when Firebase is properly configured
  }

  /**
   * Register FCM token with backend
   */
  private async registerTokenWithBackend(token: string): Promise<void> {
    try {
      // Backend registration disabled for now
      // await apiService.post('/api/notifications/register', {
      //   token,
      //   platform: Platform.OS,
      //   deviceInfo: {
      //     brand: Platform.constants.Brand || 'Unknown',
      //     model: Platform.constants.Model || 'Unknown',
      //     version: Platform.Version,
      //   }
      // });
      console.log('✅ FCM token registration skipped (backend not available)');
    } catch (error) {
      console.error('❌ Failed to register FCM token with backend:', error);
      // Don't throw - this shouldn't prevent app from working
    }
  }

  /**
   * Display local notification for foreground messages
   */
  private async displayLocalNotification(remoteMessage: any): Promise<void> {
    try {
      // Local notifications disabled - notifee not configured
      console.log('📱 Local notification display skipped (notifee not configured):', {
        title: remoteMessage.notification?.title || 'Agriculture App',
        body: remoteMessage.notification?.body || 'You have a new update'
      });
      
      // const channelId = this.getChannelId(remoteMessage.data?.type || 'system');
      // 
      // await notifee.displayNotification({
      //   id: remoteMessage.messageId || Date.now().toString(),
      //   title: remoteMessage.notification?.title || 'Agriculture App',
      //   body: remoteMessage.notification?.body || 'You have a new update',
      //   data: remoteMessage.data,
      //   android: {
      //     channelId,
      //     importance: AndroidImportance.DEFAULT,
      //     pressAction: {
      //       id: 'default',
      //     },
      //   },
      //   ios: {
      //     sound: 'default',
      //   },
      // });
    } catch (error) {
      console.error('❌ Failed to display local notification:', error);
    }
  }

  /**
   * Handle notification opened/tapped
   */
  private handleNotificationOpened(remoteMessage: any): void {
    const { data } = remoteMessage;
    
    if (data) {
      // Navigate based on notification type
      switch (data.type) {
        case 'weather':
          this.navigateToWeather(data);
          break;
        case 'activity':
          this.navigateToActivity(data);
          break;
        case 'harvest':
          this.navigateToHarvest(data);
          break;
        case 'community':
          this.navigateToCommunity(data);
          break;
        case 'market':
          this.navigateToMarket(data);
          break;
        default:
          this.navigateToHome();
      }
    }
  }

  /**
   * Get notification settings
   */
  async getSettings(): Promise<NotificationSettings> {
    try {
      const stored = await AsyncStorage.getItem('notification_settings');
      return stored ? JSON.parse(stored) : this.defaultSettings;
    } catch (error) {
      console.error('❌ Failed to get notification settings:', error);
      return this.defaultSettings;
    }
  }

  /**
   * Update notification settings
   */
  async updateSettings(settings: Partial<NotificationSettings>): Promise<void> {
    try {
      const current = await this.getSettings();
      const updated = { ...current, ...settings };
      
      await AsyncStorage.setItem('notification_settings', JSON.stringify(updated));
      
      // Backend update disabled (no server available)
      console.log('✅ Notification settings updated (local only)');
    } catch (error) {
      console.error('❌ Failed to update notification settings:', error);
      throw error;
    }
  }

  /**
   * Schedule local notification (mock implementation)
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    triggerAt: Date,
    data?: any
  ): Promise<string> {
    try {
      const notificationId = Date.now().toString();
      console.log('✅ Local notification scheduled (mock):', { id: notificationId, title, body, triggerAt });
      return notificationId;
    } catch (error) {
      console.error('❌ Failed to schedule local notification:', error);
      throw error;
    }
  }

  /**
   * Cancel scheduled notification (mock implementation)
   */
  async cancelNotification(id: string): Promise<void> {
    try {
      console.log('✅ Notification cancelled (mock):', id);
    } catch (error) {
      console.error('❌ Failed to cancel notification:', error);
      throw error;
    }
  }

  /**
   * Get all scheduled notifications (mock implementation)
   */
  async getScheduledNotifications(): Promise<any[]> {
    try {
      console.log('✅ Getting scheduled notifications (mock)');
      return []; // Return empty array for mock
    } catch (error) {
      console.error('❌ Failed to get scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Clear all notifications (mock implementation)
   */
  async clearAllNotifications(): Promise<void> {
    try {
      console.log('✅ All notifications cleared (mock)');
    } catch (error) {
      console.error('❌ Failed to clear notifications:', error);
    }
  }

  /**
   * Get channel ID based on notification type
   */
  private getChannelId(type: string): string {
    const channelMap: { [key: string]: string } = {
      weather: 'weather',
      activity: 'activity',
      harvest: 'harvest',
      community: 'community',
      market: 'market',
    };
    return channelMap[type] || 'agriculture-app';
  }

  /**
   * Navigation helpers
   */
  private navigateToWeather(data: any): void {
    // TODO: Implement navigation to weather screen
    console.log('Navigate to weather:', data);
  }

  private navigateToActivity(data: any): void {
    // TODO: Implement navigation to activity screen
    console.log('Navigate to activity:', data);
  }

  private navigateToHarvest(data: any): void {
    // TODO: Implement navigation to harvest screen
    console.log('Navigate to harvest:', data);
  }

  private navigateToCommunity(data: any): void {
    // TODO: Implement navigation to community screen
    console.log('Navigate to community:', data);
  }

  private navigateToMarket(data: any): void {
    // TODO: Implement navigation to market screen
    console.log('Navigate to market:', data);
  }

  private navigateToHome(): void {
    // TODO: Implement navigation to home screen
    console.log('Navigate to home');
  }

  private openNotificationSettings(): void {
    // TODO: Open device notification settings
    console.log('Open notification settings');
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.unsubscribeTokenRefresh) {
      this.unsubscribeTokenRefresh();
    }
    if (this.unsubscribeOnMessage) {
      this.unsubscribeOnMessage();
    }
    if (this.unsubscribeOnNotificationOpened) {
      this.unsubscribeOnNotificationOpened();
    }
    this.initialized = false;
  }

  /**
   * Get current FCM token
   */
  getCurrentToken(): string | null {
    return this.fcmToken;
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
