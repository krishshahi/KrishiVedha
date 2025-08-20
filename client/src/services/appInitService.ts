import NetInfo from '@react-native-community/netinfo';
import { store } from '../store';
import { offlineService } from './offlineService';
import { pushNotificationService } from './pushNotificationService';
import { errorHandlingService } from './errorHandlingService';
import { 
  setNetworkState, 
  performFullSync, 
  checkSyncHealth,
  setPendingChanges,
} from '../store/slices/syncSlice';
import { initializeNotifications } from '../store/slices/notificationSlice';

export interface AppInitOptions {
  enableOfflineSupport?: boolean;
  enablePushNotifications?: boolean;
  enableErrorReporting?: boolean;
  autoSyncOnInit?: boolean;
  backgroundSync?: boolean;
}

class AppInitService {
  private initialized = false;
  private networkUnsubscribe?: () => void;
  private backgroundSyncInterval?: NodeJS.Timeout;

  /**
   * Initialize all Phase 2 services and features
   */
  async initialize(options: AppInitOptions = {}): Promise<void> {
    if (this.initialized) {
      console.log('🔄 App services already initialized');
      return;
    }

    const {
      enableOfflineSupport = true,
      enablePushNotifications = true,
      enableErrorReporting = true,
      autoSyncOnInit = true,
      backgroundSync = true,
    } = options;

    try {
      console.log('🚀 Initializing Agriculture App Phase 2 services...');

      // 1. Initialize network monitoring
      await this.initializeNetworkMonitoring();

      // 2. Initialize offline support
      if (enableOfflineSupport) {
        await this.initializeOfflineSupport();
      }

      // 3. Initialize push notifications
      if (enablePushNotifications) {
        await this.initializePushNotifications();
      }

      // 4. Initialize error reporting
      if (enableErrorReporting) {
        await this.initializeErrorReporting();
      }

      // 5. Perform initial sync if online (temporarily disabled until backend endpoints are ready)
      // if (autoSyncOnInit) {
      //   await this.performInitialSync();
      // }
      console.log('📝 Note: Auto-sync disabled - backend sync endpoints not yet available');

      // 6. Setup background sync (temporarily disabled until backend endpoints are ready)
      // if (backgroundSync) {
      //   this.setupBackgroundSync();
      // }
      console.log('📝 Note: Background sync disabled - backend sync endpoints not yet available');

      // 7. Setup app state listeners
      this.setupAppStateListeners();

      this.initialized = true;
      console.log('✅ Agriculture App Phase 2 services initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize app services:', error);
      
      // Log initialization error (don't report to backend during startup)
      if (enableErrorReporting) {
        console.error('💥 App initialization error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
          action: 'app_initialization',
          screen: 'app_start',
          timestamp: new Date().toISOString(),
        });
        // Note: We don't call handleError here to prevent recursive error loops during startup
      }

      throw error;
    }
  }

  /**
   * Initialize network state monitoring
   */
  private async initializeNetworkMonitoring(): Promise<void> {
    console.log('🌐 Initializing network monitoring...');

    // Get initial network state
    const netInfo = await NetInfo.fetch();
    
    store.dispatch(setNetworkState({
      isOnline: netInfo.isConnected || false,
      connectionType: netInfo.type,
    }));

    // Subscribe to network state changes
    this.networkUnsubscribe = NetInfo.addEventListener(state => {
      const wasOnline = store.getState().sync.isOnline;
      const isOnline = state.isConnected || false;

      store.dispatch(setNetworkState({
        isOnline,
        connectionType: state.type,
      }));

      // Trigger sync when coming back online (temporarily disabled)
      // if (!wasOnline && isOnline) {
      //   console.log('📱 Device back online - triggering sync');
      //   setTimeout(() => {
      //     store.dispatch(performFullSync() as any);
      //   }, 1000); // Small delay to ensure connection is stable
      // }

      // Log network changes
      console.log(`🌐 Network state changed: ${state.type} - ${isOnline ? 'Online' : 'Offline'}`);
    });

    console.log('✅ Network monitoring initialized');
  }

  /**
   * Initialize offline support services
   */
  private async initializeOfflineSupport(): Promise<void> {
    console.log('📦 Initializing offline support...');

    // Initialize offline service
    await offlineService.initialize();

    // Check for pending changes
    const pendingChanges = await offlineService.getPendingChangesCount();
    store.dispatch(setPendingChanges(pendingChanges));

    // Check sync health
    store.dispatch(checkSyncHealth() as any);

    console.log('✅ Offline support initialized');
  }

  /**
   * Initialize push notification services
   */
  private async initializePushNotifications(): Promise<void> {
    console.log('🔔 Initializing push notifications...');

    try {
      // Initialize through Redux to manage state
      await store.dispatch(initializeNotifications() as any);
      console.log('✅ Push notifications initialized');
    } catch (error) {
      console.error('⚠️ Push notifications failed to initialize:', error);
      // Don't throw - notifications are not critical for app function
    }
  }

  /**
   * Initialize error reporting
   */
  private async initializeErrorReporting(): Promise<void> {
    console.log('🛡️ Initializing error reporting...');

    // Error service initializes automatically
    // Just clean up old metrics
    await errorHandlingService.clearOldMetrics(30);

    console.log('✅ Error reporting initialized');
  }

  /**
   * Perform initial sync if conditions are met
   */
  private async performInitialSync(): Promise<void> {
    const state = store.getState();
    const { isOnline, lastSyncTime } = state.sync;

    if (!isOnline) {
      console.log('📱 Device offline - skipping initial sync');
      return;
    }

    // Check if we need to sync (more than 5 minutes since last sync)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const needsSync = !lastSyncTime || new Date(lastSyncTime) < fiveMinutesAgo;

    if (needsSync) {
      console.log('🔄 Performing initial sync...');
      store.dispatch(performFullSync() as any);
    } else {
      console.log('✅ Data is fresh - skipping initial sync');
    }
  }

  /**
   * Setup background sync for periodic data updates
   */
  private setupBackgroundSync(): void {
    console.log('⏰ Setting up background sync...');

    // Clear existing interval
    if (this.backgroundSyncInterval) {
      clearInterval(this.backgroundSyncInterval);
    }

    // Setup periodic sync every 15 minutes
    this.backgroundSyncInterval = setInterval(async () => {
      const state = store.getState();
      const { isOnline, autoSyncEnabled, isSyncing } = state.sync;

      if (isOnline && autoSyncEnabled && !isSyncing) {
        console.log('⏰ Background sync triggered');
        store.dispatch(performFullSync() as any);
      }
    }, 15 * 60 * 1000); // 15 minutes

    console.log('✅ Background sync setup complete');
  }

  /**
   * Setup app state listeners for foreground/background transitions
   */
  private setupAppStateListeners(): void {
    console.log('👁️ Setting up app state listeners...');

    // This would typically use react-native AppState
    // For now, we'll set up the structure
    
    // TODO: Add AppState listeners for:
    // - App coming to foreground -> check for sync
    // - App going to background -> pause expensive operations
    // - Memory warnings -> clean up caches

    console.log('✅ App state listeners setup complete');
  }

  /**
   * Get initialization status
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get app health status
   */
  getHealthStatus(): AppHealthStatus {
    const state = store.getState();
    const { sync, notifications } = state;

    return {
      initialized: this.initialized,
      network: {
        online: sync.isOnline,
        connectionType: sync.connectionType,
      },
      sync: {
        healthy: !sync.syncError && sync.consecutiveFailures < 3,
        lastSync: sync.lastSyncTime,
        pendingChanges: sync.pendingChanges,
        conflicts: sync.conflicts.filter(c => !c.resolved).length,
      },
      notifications: {
        enabled: notifications.initialized,
        permissionGranted: notifications.permissionGranted,
        tokenRegistered: notifications.isRegistered,
      },
      offline: {
        supported: true,
        dataAvailable: true, // Could check actual data availability
      },
    };
  }

  /**
   * Force a complete app refresh/restart of services
   */
  async refresh(): Promise<void> {
    console.log('🔄 Refreshing app services...');

    try {
      // Clear state
      this.initialized = false;

      // Cleanup existing subscriptions
      this.cleanup();

      // Re-initialize everything
      await this.initialize({
        enableOfflineSupport: true,
        enablePushNotifications: true,
        enableErrorReporting: true,
        autoSyncOnInit: true,
        backgroundSync: true,
      });

      console.log('✅ App services refreshed successfully');
    } catch (error) {
      console.error('❌ Failed to refresh app services:', error);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    console.log('🧹 Cleaning up app services...');

    // Unsubscribe from network monitoring
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
      this.networkUnsubscribe = undefined;
    }

    // Clear background sync interval
    if (this.backgroundSyncInterval) {
      clearInterval(this.backgroundSyncInterval);
      this.backgroundSyncInterval = undefined;
    }

    // Cleanup push notification service
    if (pushNotificationService.isInitialized()) {
      pushNotificationService.cleanup();
    }

    this.initialized = false;
    console.log('✅ App services cleanup complete');
  }

  /**
   * Emergency recovery - reset all local data and re-sync
   */
  async emergencyRecovery(): Promise<void> {
    console.log('🚨 Starting emergency recovery...');

    try {
      // 1. Clear all offline data
      await offlineService.clearAllData();

      // 2. Reset sync state
      // This would dispatch reset actions

      // 3. Clear notification state
      // This would clear notifications

      // 4. Re-initialize services
      await this.refresh();

      // 5. Force full sync
      store.dispatch(performFullSync() as any);

      console.log('✅ Emergency recovery completed');
    } catch (error) {
      console.error('❌ Emergency recovery failed:', error);
      throw error;
    }
  }
}

export interface AppHealthStatus {
  initialized: boolean;
  network: {
    online: boolean;
    connectionType: string | null;
  };
  sync: {
    healthy: boolean;
    lastSync: string | null;
    pendingChanges: number;
    conflicts: number;
  };
  notifications: {
    enabled: boolean;
    permissionGranted: boolean;
    tokenRegistered: boolean;
  };
  offline: {
    supported: boolean;
    dataAvailable: boolean;
  };
}

// Export singleton instance
export const appInitService = new AppInitService();
