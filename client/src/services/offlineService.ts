import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { store } from '../store';
import apiService from './apiService';

interface OfflineChange {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  collection: 'farms' | 'crops' | 'activities' | 'posts';
  entityId: string;
  data: any;
  timestamp: string;
  synced: boolean;
}

interface SyncResult {
  success: boolean;
  applied: OfflineChange[];
  conflicts: any[];
  errors: any[];
}

class OfflineService {
  private isOnline = false;
  private syncInProgress = false;
  private pendingChanges: OfflineChange[] = [];
  private lastSyncTimestamp: string | null = null;

  constructor() {
    this.initNetworkListener();
    this.loadPendingChanges();
    this.loadLastSyncTimestamp();
  }

  /**
   * Initialize method for external initialization
   */
  async initialize(): Promise<void> {
    console.log('📦 OfflineService initializing...');
    // Constructor already handles initialization, but we can add any async setup here
    await this.loadPendingChanges();
    await this.loadLastSyncTimestamp();
    console.log('✅ OfflineService initialized successfully');
  }

  /**
   * Initialize network state listener
   */
  private initNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected || false;
      
      console.log('🌐 Network state changed:', {
        isConnected: this.isOnline,
        type: state.type,
        isInternetReachable: state.isInternetReachable
      });

      // Auto-sync when coming back online
      if (wasOffline && this.isOnline && this.pendingChanges.length > 0) {
        console.log('📡 Back online! Auto-syncing pending changes...');
        setTimeout(() => this.syncPendingChanges(), 2000); // Wait 2s for stable connection
      }
    });
  }

  /**
   * Check if device is currently online
   */
  async isDeviceOnline(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      this.isOnline = state.isConnected || false;
      return this.isOnline;
    } catch (error) {
      console.warn('Failed to check network state:', error);
      return false;
    }
  }

  /**
   * Store data locally for offline access
   */
  async storeOfflineData(key: string, data: any): Promise<void> {
    try {
      const serializedData = JSON.stringify({
        data,
        timestamp: new Date().toISOString(),
        offline: true
      });
      
      await AsyncStorage.setItem(`offline_${key}`, serializedData);
      console.log('💾 Data stored offline:', key);
    } catch (error) {
      console.error('Failed to store offline data:', error);
      throw new Error('Failed to store data offline');
    }
  }

  /**
   * Retrieve offline data
   */
  async getOfflineData(key: string): Promise<any> {
    try {
      const serializedData = await AsyncStorage.getItem(`offline_${key}`);
      if (!serializedData) return null;

      const { data, timestamp, offline } = JSON.parse(serializedData);
      console.log('📱 Retrieved offline data:', { key, timestamp, offline });
      
      return { data, timestamp, offline };
    } catch (error) {
      console.error('Failed to retrieve offline data:', error);
      return null;
    }
  }

  /**
   * Queue change for offline sync
   */
  async queueChange(
    type: OfflineChange['type'],
    collection: OfflineChange['collection'],
    entityId: string,
    data: any
  ): Promise<string> {
    const changeId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const change: OfflineChange = {
      id: changeId,
      type,
      collection,
      entityId,
      data,
      timestamp: new Date().toISOString(),
      synced: false
    };

    this.pendingChanges.push(change);
    await this.savePendingChanges();
    
    console.log(`📋 Queued ${type} change:`, {
      collection,
      entityId,
      changeId,
      totalPending: this.pendingChanges.length
    });

    // Try immediate sync if online
    if (this.isOnline) {
      this.syncPendingChanges();
    }

    return changeId;
  }

  /**
   * Get all pending changes
   */
  getPendingChanges(): OfflineChange[] {
    return [...this.pendingChanges];
  }

  /**
   * Get pending changes count
   */
  getPendingChangesCount(): number {
    return this.pendingChanges.filter(change => !change.synced).length;
  }

  /**
   * Sync pending changes with server
   */
  async syncPendingChanges(): Promise<SyncResult> {
    if (this.syncInProgress) {
      console.log('⏳ Sync already in progress, skipping...');
      return { success: false, applied: [], conflicts: [], errors: [] };
    }

    if (!this.isOnline) {
      console.log('📵 Device offline, cannot sync');
      return { success: false, applied: [], conflicts: [], errors: [] };
    }

    const unsyncedChanges = this.pendingChanges.filter(change => !change.synced);
    if (unsyncedChanges.length === 0) {
      console.log('✅ No changes to sync');
      return { success: true, applied: [], conflicts: [], errors: [] };
    }

    this.syncInProgress = true;
    console.log(`📡 Starting sync of ${unsyncedChanges.length} changes...`);

    try {
      // Prepare changes for server
      const serverChanges = unsyncedChanges.map(change => ({
        type: change.type,
        collection: change.collection,
        id: change.entityId,
        data: change.data,
        clientTimestamp: change.timestamp
      }));

      // Send to server
      const response = await apiService.post('/sync/apply', {
        changes: serverChanges
      });

      const { applied, conflicts, errors } = response.data.data;

      // Mark applied changes as synced
      applied.forEach((appliedChange: any) => {
        const localChange = this.pendingChanges.find(
          change => change.entityId === appliedChange.id && !change.synced
        );
        if (localChange) {
          localChange.synced = true;
        }
      });

      // Remove synced changes
      this.pendingChanges = this.pendingChanges.filter(change => !change.synced);
      await this.savePendingChanges();

      // Update last sync timestamp
      this.lastSyncTimestamp = new Date().toISOString();
      await this.saveLastSyncTimestamp();

      console.log('✅ Sync completed:', {
        applied: applied.length,
        conflicts: conflicts.length,
        errors: errors.length,
        remaining: this.pendingChanges.length
      });

      return {
        success: true,
        applied,
        conflicts,
        errors
      };

    } catch (error) {
      console.error('❌ Sync failed:', error);
      return {
        success: false,
        applied: [],
        conflicts: [],
        errors: [{ error: error.message }]
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync data from server (download changes)
   */
  async syncFromServer(): Promise<boolean> {
    if (!this.isOnline) {
      console.log('📵 Device offline, cannot sync from server');
      return false;
    }

    try {
      console.log('📥 Syncing data from server...');
      
      // Get changes since last sync
      const response = await apiService.get('/sync/changes', {
        params: {
          lastSync: this.lastSyncTimestamp,
          collections: 'farms,crops,activities,posts'
        }
      });

      const { data } = response.data;
      const { farms, crops, activities, posts, syncTimestamp } = data;

      // Store updated data offline
      if (farms?.length > 0) {
        await this.storeOfflineData('farms', farms);
      }
      
      if (crops?.length > 0) {
        await this.storeOfflineData('crops', crops);
      }
      
      if (activities?.length > 0) {
        await this.storeOfflineData('activities', activities);
      }
      
      if (posts?.length > 0) {
        await this.storeOfflineData('community_posts', posts);
      }

      // Update sync timestamp
      this.lastSyncTimestamp = syncTimestamp;
      await this.saveLastSyncTimestamp();

      console.log('✅ Server sync completed:', {
        farms: farms?.length || 0,
        crops: crops?.length || 0,
        activities: activities?.length || 0,
        posts: posts?.length || 0
      });

      return true;

    } catch (error) {
      console.error('❌ Server sync failed:', error);
      return false;
    }
  }

  /**
   * Perform full sync (both directions)
   */
  async performFullSync(): Promise<{ success: boolean; details: any }> {
    console.log('🔄 Starting full sync...');
    
    const results = {
      uploadSuccess: false,
      downloadSuccess: false,
      uploadResult: null as SyncResult | null,
      conflicts: [] as any[]
    };

    try {
      // First upload pending changes
      if (this.pendingChanges.length > 0) {
        console.log('📤 Uploading pending changes...');
        results.uploadResult = await this.syncPendingChanges();
        results.uploadSuccess = results.uploadResult.success;
        results.conflicts = results.uploadResult.conflicts;
      } else {
        results.uploadSuccess = true;
      }

      // Then download server changes
      console.log('📥 Downloading server changes...');
      results.downloadSuccess = await this.syncFromServer();

      const overallSuccess = results.uploadSuccess && results.downloadSuccess;
      
      console.log('🔄 Full sync completed:', {
        success: overallSuccess,
        uploadSuccess: results.uploadSuccess,
        downloadSuccess: results.downloadSuccess,
        conflicts: results.conflicts.length
      });

      return {
        success: overallSuccess,
        details: results
      };

    } catch (error) {
      console.error('❌ Full sync failed:', error);
      return {
        success: false,
        details: { ...results, error: error.message }
      };
    }
  }

  /**
   * Check if data is fresh (recent enough)
   */
  async isDataFresh(key: string, maxAgeMinutes: number = 60): Promise<boolean> {
    try {
      const offlineData = await this.getOfflineData(key);
      if (!offlineData) return false;

      const dataAge = Date.now() - new Date(offlineData.timestamp).getTime();
      const maxAge = maxAgeMinutes * 60 * 1000; // Convert to milliseconds
      
      return dataAge < maxAge;
    } catch (error) {
      console.error('Failed to check data freshness:', error);
      return false;
    }
  }

  /**
   * Clear all offline data
   */
  async clearOfflineData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const offlineKeys = keys.filter(key => key.startsWith('offline_'));
      
      await AsyncStorage.multiRemove(offlineKeys);
      this.pendingChanges = [];
      this.lastSyncTimestamp = null;
      
      await this.savePendingChanges();
      await this.saveLastSyncTimestamp();
      
      console.log('🗑️ All offline data cleared');
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      throw error;
    }
  }

  /**
   * Clear all data (alias for emergency recovery)
   */
  async clearAllData(): Promise<void> {
    console.log('🚨 Clearing all offline data for emergency recovery...');
    await this.clearOfflineData();
  }

  /**
   * Get sync status information
   */
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      pendingChanges: this.getPendingChangesCount(),
      lastSync: this.lastSyncTimestamp,
      syncInProgress: this.syncInProgress
    };
  }

  // Private helper methods
  private async loadPendingChanges(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('pending_changes');
      this.pendingChanges = data ? JSON.parse(data) : [];
      console.log(`📋 Loaded ${this.pendingChanges.length} pending changes`);
    } catch (error) {
      console.error('Failed to load pending changes:', error);
      this.pendingChanges = [];
    }
  }

  private async savePendingChanges(): Promise<void> {
    try {
      await AsyncStorage.setItem('pending_changes', JSON.stringify(this.pendingChanges));
    } catch (error) {
      console.error('Failed to save pending changes:', error);
    }
  }

  private async loadLastSyncTimestamp(): Promise<void> {
    try {
      this.lastSyncTimestamp = await AsyncStorage.getItem('last_sync_timestamp');
      console.log('📅 Last sync timestamp:', this.lastSyncTimestamp);
    } catch (error) {
      console.error('Failed to load last sync timestamp:', error);
    }
  }

  private async saveLastSyncTimestamp(): Promise<void> {
    try {
      if (this.lastSyncTimestamp) {
        await AsyncStorage.setItem('last_sync_timestamp', this.lastSyncTimestamp);
      }
    } catch (error) {
      console.error('Failed to save last sync timestamp:', error);
    }
  }
}

// Export singleton instance
export const offlineService = new OfflineService();
export default offlineService;
