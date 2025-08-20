import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { offlineService } from '../../services/offlineService';
import { errorHandlingService } from '../../services/errorHandlingService';

export interface SyncState {
  // Sync status
  isSyncing: boolean;
  lastSyncTime: string | null;
  lastSyncAttempt: string | null;
  syncProgress: number; // 0-100
  
  // Network state
  isOnline: boolean;
  connectionType: string | null;
  
  // Sync metadata
  syncNeeded: boolean;
  autoSyncEnabled: boolean;
  syncInterval: number; // minutes
  
  // Offline changes
  pendingChanges: number;
  pendingUploads: number;
  
  // Sync conflicts
  conflicts: SyncConflict[];
  
  // Error state
  syncError: string | null;
  consecutiveFailures: number;
  
  // Data freshness
  dataFreshness: {
    crops: string | null;
    activities: string | null;
    community: string | null;
    weather: string | null;
  };
}

export interface SyncConflict {
  id: string;
  type: 'crops' | 'activities' | 'community';
  itemId: string;
  field: string;
  localValue: any;
  serverValue: any;
  timestamp: string;
  resolved: boolean;
}

export interface SyncProgress {
  stage: 'connecting' | 'downloading' | 'uploading' | 'resolving' | 'complete';
  current: number;
  total: number;
  message: string;
}

const initialState: SyncState = {
  isSyncing: false,
  lastSyncTime: null,
  lastSyncAttempt: null,
  syncProgress: 0,
  
  isOnline: true,
  connectionType: null,
  
  syncNeeded: false,
  autoSyncEnabled: true,
  syncInterval: 15, // 15 minutes
  
  pendingChanges: 0,
  pendingUploads: 0,
  
  conflicts: [],
  
  syncError: null,
  consecutiveFailures: 0,
  
  dataFreshness: {
    crops: null,
    activities: null,
    community: null,
    weather: null,
  },
};

// Async thunks
export const performFullSync = createAsyncThunk(
  'sync/performFullSync',
  async (_, { dispatch, getState, rejectWithValue }) => {
    try {
      dispatch(setSyncProgress({ stage: 'connecting', current: 0, total: 100, message: 'Connecting to server...' }));
      
      const result = await offlineService.performFullSync();
      
      dispatch(setSyncProgress({ stage: 'complete', current: 100, total: 100, message: 'Sync complete' }));
      
      return result;
    } catch (error) {
      await errorHandlingService.handleError(error, {
        action: 'full_sync',
        screen: 'sync',
        timestamp: new Date(),
      });
      
      return rejectWithValue({
        message: error.message || 'Sync failed',
        code: error.code,
      });
    }
  }
);

export const syncSpecificData = createAsyncThunk(
  'sync/syncSpecificData',
  async (
    { dataType, forceRefresh = false }: { dataType: 'crops' | 'activities' | 'community' | 'weather'; forceRefresh?: boolean },
    { dispatch, rejectWithValue }
  ) => {
    try {
      let result;
      
      switch (dataType) {
        case 'crops':
          result = await offlineService.syncCrops(forceRefresh);
          break;
        case 'activities':
          result = await offlineService.syncActivities(forceRefresh);
          break;
        case 'community':
          result = await offlineService.syncCommunity(forceRefresh);
          break;
        case 'weather':
          // Weather sync would be implemented here
          result = { synced: 0, conflicts: [] };
          break;
        default:
          throw new Error(`Unknown data type: ${dataType}`);
      }
      
      return { dataType, result };
    } catch (error) {
      await errorHandlingService.handleError(error, {
        action: `sync_${dataType}`,
        screen: 'sync',
        timestamp: new Date(),
      });
      
      return rejectWithValue({
        message: error.message || `Failed to sync ${dataType}`,
        dataType,
      });
    }
  }
);

export const resolveConflict = createAsyncThunk(
  'sync/resolveConflict',
  async (
    { 
      conflictId, 
      resolution, 
      customValue 
    }: { 
      conflictId: string; 
      resolution: 'server' | 'local' | 'custom'; 
      customValue?: any 
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { sync: SyncState };
      const conflict = state.sync.conflicts.find(c => c.id === conflictId);
      
      if (!conflict) {
        throw new Error('Conflict not found');
      }
      
      let resolvedValue;
      switch (resolution) {
        case 'server':
          resolvedValue = conflict.serverValue;
          break;
        case 'local':
          resolvedValue = conflict.localValue;
          break;
        case 'custom':
          resolvedValue = customValue;
          break;
        default:
          throw new Error('Invalid resolution type');
      }
      
      // Apply resolution through offline service
      await offlineService.resolveConflict(conflict.type, conflict.itemId, conflict.field, resolvedValue);
      
      return { conflictId, resolution, resolvedValue };
    } catch (error) {
      return rejectWithValue({
        message: error.message || 'Failed to resolve conflict',
        conflictId,
      });
    }
  }
);

export const checkSyncHealth = createAsyncThunk(
  'sync/checkSyncHealth',
  async (_, { rejectWithValue }) => {
    try {
      const health = await offlineService.getSyncStatus();
      return health;
    } catch (error) {
      return rejectWithValue({
        message: error.message || 'Failed to check sync health',
      });
    }
  }
);

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    // Network state
    setNetworkState: (state, action: PayloadAction<{ isOnline: boolean; connectionType?: string }>) => {
      state.isOnline = action.payload.isOnline;
      state.connectionType = action.payload.connectionType || null;
      
      // Reset consecutive failures when back online
      if (action.payload.isOnline && state.consecutiveFailures > 0) {
        state.consecutiveFailures = 0;
        state.syncError = null;
      }
    },
    
    // Sync settings
    setAutoSync: (state, action: PayloadAction<boolean>) => {
      state.autoSyncEnabled = action.payload;
    },
    
    setSyncInterval: (state, action: PayloadAction<number>) => {
      state.syncInterval = action.payload;
    },
    
    // Sync progress
    setSyncProgress: (state, action: PayloadAction<SyncProgress>) => {
      const { stage, current, total, message } = action.payload;
      state.syncProgress = Math.round((current / total) * 100);
      
      // Update sync status based on stage
      state.isSyncing = stage !== 'complete';
    },
    
    // Pending changes
    setPendingChanges: (state, action: PayloadAction<number>) => {
      state.pendingChanges = action.payload;
      state.syncNeeded = action.payload > 0;
    },
    
    setPendingUploads: (state, action: PayloadAction<number>) => {
      state.pendingUploads = action.payload;
    },
    
    // Data freshness
    updateDataFreshness: (state, action: PayloadAction<{ type: keyof SyncState['dataFreshness']; timestamp: string }>) => {
      state.dataFreshness[action.payload.type] = action.payload.timestamp;
    },
    
    // Conflicts
    addConflict: (state, action: PayloadAction<Omit<SyncConflict, 'id' | 'resolved'>>) => {
      const conflict: SyncConflict = {
        ...action.payload,
        id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        resolved: false,
      };
      
      // Avoid duplicate conflicts
      const existing = state.conflicts.find(
        c => c.type === conflict.type && 
             c.itemId === conflict.itemId && 
             c.field === conflict.field &&
             !c.resolved
      );
      
      if (!existing) {
        state.conflicts.push(conflict);
      }
    },
    
    removeConflict: (state, action: PayloadAction<string>) => {
      state.conflicts = state.conflicts.filter(c => c.id !== action.payload);
    },
    
    markConflictResolved: (state, action: PayloadAction<string>) => {
      const conflict = state.conflicts.find(c => c.id === action.payload);
      if (conflict) {
        conflict.resolved = true;
      }
    },
    
    clearResolvedConflicts: (state) => {
      state.conflicts = state.conflicts.filter(c => !c.resolved);
    },
    
    // Error handling
    setSyncError: (state, action: PayloadAction<string | null>) => {
      state.syncError = action.payload;
      if (action.payload) {
        state.consecutiveFailures += 1;
      } else {
        state.consecutiveFailures = 0;
      }
    },
    
    // Manual sync triggers
    markSyncNeeded: (state, action: PayloadAction<boolean>) => {
      state.syncNeeded = action.payload;
    },
    
    // Reset sync state
    resetSyncState: (state) => {
      return {
        ...initialState,
        isOnline: state.isOnline,
        connectionType: state.connectionType,
        autoSyncEnabled: state.autoSyncEnabled,
        syncInterval: state.syncInterval,
      };
    },
  },
  extraReducers: (builder) => {
    // Full sync
    builder
      .addCase(performFullSync.pending, (state) => {
        state.isSyncing = true;
        state.syncError = null;
        state.lastSyncAttempt = new Date().toISOString();
        state.syncProgress = 0;
      })
      .addCase(performFullSync.fulfilled, (state, action) => {
        state.isSyncing = false;
        state.lastSyncTime = new Date().toISOString();
        state.syncProgress = 100;
        state.syncNeeded = false;
        state.consecutiveFailures = 0;
        state.syncError = null;
        
        // Update pending changes based on sync result
        if (action.payload) {
          state.pendingChanges = action.payload.pendingChanges || 0;
          state.pendingUploads = 0; // Uploads completed
          
          // Add any new conflicts
          if (action.payload.conflicts) {
            action.payload.conflicts.forEach((conflict: any) => {
              const syncConflict: SyncConflict = {
                id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: conflict.type,
                itemId: conflict.itemId,
                field: conflict.field,
                localValue: conflict.localValue,
                serverValue: conflict.serverValue,
                timestamp: new Date().toISOString(),
                resolved: false,
              };
              
              // Avoid duplicates
              const exists = state.conflicts.some(
                c => c.type === syncConflict.type && 
                     c.itemId === syncConflict.itemId && 
                     c.field === syncConflict.field &&
                     !c.resolved
              );
              
              if (!exists) {
                state.conflicts.push(syncConflict);
              }
            });
          }
        }
        
        // Update data freshness
        const now = new Date().toISOString();
        state.dataFreshness.crops = now;
        state.dataFreshness.activities = now;
        state.dataFreshness.community = now;
      })
      .addCase(performFullSync.rejected, (state, action) => {
        state.isSyncing = false;
        state.syncProgress = 0;
        state.consecutiveFailures += 1;
        
        if (action.payload) {
          state.syncError = action.payload.message;
        } else {
          state.syncError = 'Sync failed with unknown error';
        }
      });
    
    // Specific data sync
    builder
      .addCase(syncSpecificData.fulfilled, (state, action) => {
        const { dataType, result } = action.payload;
        
        // Update data freshness for this type
        state.dataFreshness[dataType] = new Date().toISOString();
        
        // Update pending changes if applicable
        if (result.pendingChanges !== undefined) {
          state.pendingChanges = result.pendingChanges;
        }
      })
      .addCase(syncSpecificData.rejected, (state, action) => {
        if (action.payload) {
          state.syncError = action.payload.message;
        }
      });
    
    // Conflict resolution
    builder
      .addCase(resolveConflict.fulfilled, (state, action) => {
        const { conflictId } = action.payload;
        const conflict = state.conflicts.find(c => c.id === conflictId);
        if (conflict) {
          conflict.resolved = true;
        }
      });
    
    // Sync health check
    builder
      .addCase(checkSyncHealth.fulfilled, (state, action) => {
        const health = action.payload;
        
        if (health) {
          state.pendingChanges = health.pendingChanges || 0;
          state.syncNeeded = health.syncNeeded || false;
          state.lastSyncTime = health.lastSync || state.lastSyncTime;
          
          // Update data freshness if provided
          if (health.dataFreshness) {
            Object.assign(state.dataFreshness, health.dataFreshness);
          }
        }
      });
  },
});

export const {
  setNetworkState,
  setAutoSync,
  setSyncInterval,
  setSyncProgress,
  setPendingChanges,
  setPendingUploads,
  updateDataFreshness,
  addConflict,
  removeConflict,
  markConflictResolved,
  clearResolvedConflicts,
  setSyncError,
  markSyncNeeded,
  resetSyncState,
} = syncSlice.actions;

export default syncSlice.reducer;

// Selectors
export const selectSyncState = (state: { sync: SyncState }) => state.sync;
export const selectIsSyncing = (state: { sync: SyncState }) => state.sync.isSyncing;
export const selectIsOnline = (state: { sync: SyncState }) => state.sync.isOnline;
export const selectSyncNeeded = (state: { sync: SyncState }) => state.sync.syncNeeded;
export const selectPendingChanges = (state: { sync: SyncState }) => state.sync.pendingChanges;
export const selectSyncConflicts = (state: { sync: SyncState }) => state.sync.conflicts.filter(c => !c.resolved);
export const selectLastSyncTime = (state: { sync: SyncState }) => state.sync.lastSyncTime;
export const selectSyncError = (state: { sync: SyncState }) => state.sync.syncError;
export const selectDataFreshness = (state: { sync: SyncState }) => state.sync.dataFreshness;
export const selectConsecutiveFailures = (state: { sync: SyncState }) => state.sync.consecutiveFailures;
export const selectAutoSyncEnabled = (state: { sync: SyncState }) => state.sync.autoSyncEnabled;
