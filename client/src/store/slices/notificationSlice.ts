import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { pushNotificationService, NotificationSettings, PushNotification } from '../../services/pushNotificationService';
import { errorHandlingService } from '../../services/errorHandlingService';

export interface NotificationState {
  // Settings
  settings: NotificationSettings;
  
  // Token and registration
  fcmToken: string | null;
  isRegistered: boolean;
  
  // Service state
  initialized: boolean;
  permissionGranted: boolean;
  
  // Notifications
  notifications: PushNotification[];
  unreadCount: number;
  
  // Scheduled notifications
  scheduledNotifications: string[]; // Array of notification IDs
  
  // Error state
  error: string | null;
  
  // Local notification settings
  localNotificationEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  
  // Badge count
  badgeCount: number;
}

const initialState: NotificationState = {
  settings: {
    weatherAlerts: true,
    activityReminders: true,
    harvestReminders: true,
    communityUpdates: true,
    marketUpdates: false,
    systemNotifications: true,
  },
  
  fcmToken: null,
  isRegistered: false,
  
  initialized: false,
  permissionGranted: false,
  
  notifications: [],
  unreadCount: 0,
  
  scheduledNotifications: [],
  
  error: null,
  
  localNotificationEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  
  badgeCount: 0,
};

// Async thunks
export const initializeNotifications = createAsyncThunk(
  'notifications/initialize',
  async (_, { rejectWithValue }) => {
    try {
      await pushNotificationService.initialize();
      
      const token = pushNotificationService.getCurrentToken();
      const settings = await pushNotificationService.getSettings();
      const isInitialized = pushNotificationService.isInitialized();
      
      return {
        token,
        settings,
        initialized: isInitialized,
        permissionGranted: true, // If initialization succeeded, permission was granted
      };
    } catch (error) {
      await errorHandlingService.handleError(error, {
        action: 'initialize_notifications',
        screen: 'app_start',
        timestamp: new Date(),
      });
      
      return rejectWithValue({
        message: error.message || 'Failed to initialize notifications',
      });
    }
  }
);

export const updateNotificationSettings = createAsyncThunk(
  'notifications/updateSettings',
  async (
    settings: Partial<NotificationSettings>,
    { rejectWithValue }
  ) => {
    try {
      await pushNotificationService.updateSettings(settings);
      const updatedSettings = await pushNotificationService.getSettings();
      
      return updatedSettings;
    } catch (error) {
      await errorHandlingService.handleError(error, {
        action: 'update_notification_settings',
        screen: 'settings',
        timestamp: new Date(),
      });
      
      return rejectWithValue({
        message: error.message || 'Failed to update notification settings',
      });
    }
  }
);

export const scheduleLocalNotification = createAsyncThunk(
  'notifications/scheduleLocal',
  async (
    {
      title,
      body,
      triggerAt,
      data,
    }: {
      title: string;
      body: string;
      triggerAt: Date;
      data?: any;
    },
    { rejectWithValue }
  ) => {
    try {
      const notificationId = await pushNotificationService.scheduleLocalNotification(
        title,
        body,
        triggerAt,
        data
      );
      
      return {
        id: notificationId,
        title,
        body,
        triggerAt: triggerAt.toISOString(),
        data,
      };
    } catch (error) {
      await errorHandlingService.handleError(error, {
        action: 'schedule_local_notification',
        screen: 'notifications',
        timestamp: new Date(),
      });
      
      return rejectWithValue({
        message: error.message || 'Failed to schedule notification',
      });
    }
  }
);

export const cancelScheduledNotification = createAsyncThunk(
  'notifications/cancelScheduled',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      await pushNotificationService.cancelNotification(notificationId);
      return notificationId;
    } catch (error) {
      await errorHandlingService.handleError(error, {
        action: 'cancel_notification',
        screen: 'notifications',
        timestamp: new Date(),
      });
      
      return rejectWithValue({
        message: error.message || 'Failed to cancel notification',
        notificationId,
      });
    }
  }
);

export const loadScheduledNotifications = createAsyncThunk(
  'notifications/loadScheduled',
  async (_, { rejectWithValue }) => {
    try {
      const notifications = await pushNotificationService.getScheduledNotifications();
      return notifications.map((n: any) => n.id || n.notification?.id).filter(Boolean);
    } catch (error) {
      return rejectWithValue({
        message: error.message || 'Failed to load scheduled notifications',
      });
    }
  }
);

export const clearAllNotifications = createAsyncThunk(
  'notifications/clearAll',
  async (_, { rejectWithValue }) => {
    try {
      await pushNotificationService.clearAllNotifications();
      return true;
    } catch (error) {
      await errorHandlingService.handleError(error, {
        action: 'clear_all_notifications',
        screen: 'notifications',
        timestamp: new Date(),
      });
      
      return rejectWithValue({
        message: error.message || 'Failed to clear notifications',
      });
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // Notification management
    addNotification: (state, action: PayloadAction<Omit<PushNotification, 'id' | 'createdAt' | 'read'>>) => {
      const notification: PushNotification = {
        ...action.payload,
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        read: false,
      };
      
      // Add to beginning of array (most recent first)
      state.notifications.unshift(notification);
      
      // Limit to last 100 notifications
      if (state.notifications.length > 100) {
        state.notifications = state.notifications.slice(0, 100);
      }
      
      // Update counts
      state.unreadCount += 1;
      state.badgeCount += 1;
    },
    
    markNotificationRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
        state.badgeCount = Math.max(0, state.badgeCount - 1);
      }
    },
    
    markAllNotificationsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
      state.unreadCount = 0;
      state.badgeCount = 0;
    },
    
    removeNotification: (state, action: PayloadAction<string>) => {
      const index = state.notifications.findIndex(n => n.id === action.payload);
      if (index !== -1) {
        const notification = state.notifications[index];
        if (!notification.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
          state.badgeCount = Math.max(0, state.badgeCount - 1);
        }
        state.notifications.splice(index, 1);
      }
    },
    
    clearReadNotifications: (state) => {
      state.notifications = state.notifications.filter(n => !n.read);
    },
    
    // Settings management
    updateLocalSettings: (state, action: PayloadAction<Partial<NotificationSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    
    setLocalNotificationEnabled: (state, action: PayloadAction<boolean>) => {
      state.localNotificationEnabled = action.payload;
    },
    
    setSoundEnabled: (state, action: PayloadAction<boolean>) => {
      state.soundEnabled = action.payload;
    },
    
    setVibrationEnabled: (state, action: PayloadAction<boolean>) => {
      state.vibrationEnabled = action.payload;
    },
    
    // Token and registration
    setFcmToken: (state, action: PayloadAction<string | null>) => {
      state.fcmToken = action.payload;
      state.isRegistered = action.payload !== null;
    },
    
    setPermissionGranted: (state, action: PayloadAction<boolean>) => {
      state.permissionGranted = action.payload;
    },
    
    // Error handling
    setNotificationError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    // Badge count
    setBadgeCount: (state, action: PayloadAction<number>) => {
      state.badgeCount = Math.max(0, action.payload);
    },
    
    incrementBadgeCount: (state) => {
      state.badgeCount += 1;
    },
    
    decrementBadgeCount: (state) => {
      state.badgeCount = Math.max(0, state.badgeCount - 1);
    },
    
    resetBadgeCount: (state) => {
      state.badgeCount = 0;
    },
    
    // Reset state
    resetNotificationState: () => initialState,
  },
  extraReducers: (builder) => {
    // Initialize notifications
    builder
      .addCase(initializeNotifications.pending, (state) => {
        state.error = null;
      })
      .addCase(initializeNotifications.fulfilled, (state, action) => {
        state.initialized = action.payload.initialized;
        state.permissionGranted = action.payload.permissionGranted;
        state.fcmToken = action.payload.token;
        state.isRegistered = action.payload.token !== null;
        state.settings = action.payload.settings;
        state.error = null;
      })
      .addCase(initializeNotifications.rejected, (state, action) => {
        state.initialized = false;
        state.permissionGranted = false;
        
        if (action.payload) {
          state.error = action.payload.message;
        } else {
          state.error = 'Failed to initialize notifications';
        }
      });
    
    // Update settings
    builder
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
        state.error = null;
      })
      .addCase(updateNotificationSettings.rejected, (state, action) => {
        if (action.payload) {
          state.error = action.payload.message;
        }
      });
    
    // Schedule local notification
    builder
      .addCase(scheduleLocalNotification.fulfilled, (state, action) => {
        state.scheduledNotifications.push(action.payload.id);
        state.error = null;
      })
      .addCase(scheduleLocalNotification.rejected, (state, action) => {
        if (action.payload) {
          state.error = action.payload.message;
        }
      });
    
    // Cancel scheduled notification
    builder
      .addCase(cancelScheduledNotification.fulfilled, (state, action) => {
        const index = state.scheduledNotifications.indexOf(action.payload);
        if (index !== -1) {
          state.scheduledNotifications.splice(index, 1);
        }
        state.error = null;
      })
      .addCase(cancelScheduledNotification.rejected, (state, action) => {
        if (action.payload) {
          state.error = action.payload.message;
        }
      });
    
    // Load scheduled notifications
    builder
      .addCase(loadScheduledNotifications.fulfilled, (state, action) => {
        state.scheduledNotifications = action.payload;
      });
    
    // Clear all notifications
    builder
      .addCase(clearAllNotifications.fulfilled, (state) => {
        state.notifications = [];
        state.unreadCount = 0;
        state.badgeCount = 0;
        state.scheduledNotifications = [];
        state.error = null;
      })
      .addCase(clearAllNotifications.rejected, (state, action) => {
        if (action.payload) {
          state.error = action.payload.message;
        }
      });
  },
});

export const {
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  removeNotification,
  clearReadNotifications,
  updateLocalSettings,
  setLocalNotificationEnabled,
  setSoundEnabled,
  setVibrationEnabled,
  setFcmToken,
  setPermissionGranted,
  setNotificationError,
  setBadgeCount,
  incrementBadgeCount,
  decrementBadgeCount,
  resetBadgeCount,
  resetNotificationState,
} = notificationSlice.actions;

export default notificationSlice.reducer;

// Selectors
export const selectNotificationState = (state: { notifications: NotificationState }) => state.notifications;
export const selectNotificationSettings = (state: { notifications: NotificationState }) => state.notifications.settings;
export const selectFcmToken = (state: { notifications: NotificationState }) => state.notifications.fcmToken;
export const selectIsNotificationRegistered = (state: { notifications: NotificationState }) => state.notifications.isRegistered;
export const selectNotificationPermission = (state: { notifications: NotificationState }) => state.notifications.permissionGranted;
export const selectNotifications = (state: { notifications: NotificationState }) => state.notifications.notifications;
export const selectUnreadNotifications = (state: { notifications: NotificationState }) => 
  state.notifications.notifications.filter(n => !n.read);
export const selectUnreadCount = (state: { notifications: NotificationState }) => state.notifications.unreadCount;
export const selectBadgeCount = (state: { notifications: NotificationState }) => state.notifications.badgeCount;
export const selectScheduledNotifications = (state: { notifications: NotificationState }) => state.notifications.scheduledNotifications;
export const selectNotificationError = (state: { notifications: NotificationState }) => state.notifications.error;
export const selectNotificationInitialized = (state: { notifications: NotificationState }) => state.notifications.initialized;
