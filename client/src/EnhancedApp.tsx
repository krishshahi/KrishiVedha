/**
 * Enhanced React Native App with Phase 2 Features
 * Includes offline support, push notifications, and error handling
 * 
 * @format
 */

// Import polyfills first
import 'react-native-url-polyfill/auto';
import React, { useEffect, useState } from 'react';
import { 
  StatusBar, 
  StyleSheet, 
  SafeAreaView, 
  View, 
  Text, 
  ActivityIndicator,
  Alert,
  AppState,
  AppStateStatus,
  TouchableOpacity,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import NetInfo from '@react-native-community/netinfo';

// Navigation and Store
import AppNavigator from './navigation/AppNavigator';
import { store, persistor } from './store';

// Constants and Utils
import { COLORS } from './constants/colors';
import { startNetworkMonitoring, stopNetworkMonitoring } from './utils/networkChangeDetector';

// Phase 2 Services
import { appInitService, AppHealthStatus } from './services/appInitService';
import { offlineService } from './services/offlineService';
import { pushNotificationService } from './services/pushNotificationService';
import { errorHandlingService } from './services/errorHandlingService';

// Phase 2 Components
import ErrorBoundary from './components/ErrorBoundary';
import OfflineIndicator from './components/OfflineIndicator';

// Redux Actions
import { 
  setNetworkState, 
  performFullSync,
  initializeNotifications,
} from './store/slices/syncSlice';

interface AppInitializationState {
  isInitializing: boolean;
  isReady: boolean;
  initError: string | null;
  healthStatus: AppHealthStatus | null;
}

/**
 * Enhanced Agriculture App with Phase 2 Features
 * - Offline-first data storage and synchronization
 * - Push notifications with FCM
 * - Advanced error handling and recovery
 * - Network state management
 * - Background sync and app state handling
 */
const EnhancedApp: React.FC = () => {
  const [initState, setInitState] = useState<AppInitializationState>({
    isInitializing: true,
    isReady: false,
    initError: null,
    healthStatus: null,
  });

  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  // Initialize all Phase 2 services
  useEffect(() => {
    initializeApp();
  }, []);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log(`📱 App state changed: ${appState} -> ${nextAppState}`);
      
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to foreground
        handleAppForeground();
      } else if (appState === 'active' && nextAppState.match(/inactive|background/)) {
        // App is going to background
        handleAppBackground();
      }
      
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [appState]);

  // Initialize the app with all Phase 2 services
  const initializeApp = async () => {
    console.log('🚀 Starting Enhanced Agriculture App initialization...');
    
    try {
      setInitState(prev => ({ ...prev, isInitializing: true, initError: null }));

      // Step 1: Start network monitoring (existing)
      console.log('🌐 Starting network monitoring...');
      startNetworkMonitoring();

      // Step 2: Initialize Phase 2 services
      console.log('📦 Initializing Phase 2 services...');
      await appInitService.initialize({
        enableOfflineSupport: true,
        enablePushNotifications: true,
        enableErrorReporting: true,
        autoSyncOnInit: true,
        backgroundSync: true,
      });

      // Step 3: Get health status
      const healthStatus = appInitService.getHealthStatus();
      console.log('💚 App health status:', healthStatus);

      // Step 4: Setup network state listener
      setupNetworkStateListener();

      // Step 5: Mark as ready
      setInitState({
        isInitializing: false,
        isReady: true,
        initError: null,
        healthStatus,
      });

      console.log('✅ Enhanced Agriculture App initialized successfully!');
      
      // Show success notification if permissions granted
      if (healthStatus.notifications.permissionGranted) {
        setTimeout(() => {
          Alert.alert(
            '🎉 Welcome to Enhanced Agriculture App!',
            'Your app is now ready with offline support, push notifications, and smart sync features.',
            [{ text: 'Great!', style: 'default' }]
          );
        }, 1000);
      }

    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Agriculture App:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      
      setInitState({
        isInitializing: false,
        isReady: false,
        initError: errorMessage,
        healthStatus: null,
      });

      // Report initialization error
      try {
        await errorHandlingService.handleError(error, {
          action: 'app_initialization',
          screen: 'app_start',
          timestamp: new Date(),
        }, false);
      } catch (reportError) {
        console.error('Failed to report initialization error:', reportError);
      }
    }
  };

  // Setup network state listener
  const setupNetworkStateListener = () => {
    NetInfo.addEventListener(state => {
      const isOnline = state.isConnected || false;
      const connectionType = state.type;
      
      // Update Redux store
      store.dispatch(setNetworkState({ isOnline, connectionType }));
      
      console.log(`🌐 Network changed: ${connectionType} - ${isOnline ? 'Online' : 'Offline'}`);
    });
  };

  // Handle app coming to foreground
  const handleAppForeground = async () => {
    console.log('📱 App came to foreground - checking for updates...');
    
    try {
      if (appInitService.isInitialized()) {
        // Check health status
        const healthStatus = appInitService.getHealthStatus();
        setInitState(prev => ({ ...prev, healthStatus }));
        
        // Trigger sync if online and data is stale
        if (healthStatus.network.online) {
          store.dispatch(performFullSync() as any);
        }
      }
    } catch (error) {
      console.error('❌ Error handling app foreground:', error);
    }
  };

  // Handle app going to background
  const handleAppBackground = () => {
    console.log('📱 App going to background - pausing operations...');
    
    // Could pause expensive operations here
    // For now, just log
  };

  // Handle retry initialization
  const handleRetryInitialization = async () => {
    console.log('🔄 Retrying app initialization...');
    
    // Reset state and try again
    setInitState(prev => ({ ...prev, initError: null }));
    
    try {
      // Cleanup existing services
      appInitService.cleanup();
      
      // Try emergency recovery if needed
      if (initState.initError?.includes('sync') || initState.initError?.includes('offline')) {
        console.log('🚨 Attempting emergency recovery...');
        await appInitService.emergencyRecovery();
      } else {
        // Normal retry
        await initializeApp();
      }
    } catch (error) {
      console.error('❌ Retry initialization failed:', error);
      setInitState(prev => ({
        ...prev,
        initError: 'Retry failed. Please restart the app.'
      }));
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up Enhanced Agriculture App...');
      
      // Stop network monitoring
      stopNetworkMonitoring();
      
      // Cleanup Phase 2 services
      if (appInitService.isInitialized()) {
        appInitService.cleanup();
      }
    };
  }, []);

  // Render initialization screen
  const renderInitializationScreen = () => {
    const { isInitializing, initError } = initState;
    
    return (
      <View style={styles.initContainer}>
        <View style={styles.initContent}>
          {/* App Logo/Icon */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>🌾</Text>
            <Text style={styles.appName}>Agriculture App</Text>
            <Text style={styles.appSubtitle}>Enhanced with Offline & Sync</Text>
          </View>
          
          {isInitializing ? (
            <>
              <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
              <Text style={styles.initText}>Initializing services...</Text>
              <Text style={styles.initSubtext}>Setting up offline support & notifications</Text>
            </>
          ) : initError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorTitle}>Initialization Failed</Text>
              <Text style={styles.errorMessage}>{initError}</Text>
              
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={handleRetryInitialization}
              >
                <Text style={styles.retryButtonText}>Retry Setup</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.skipButton}
                onPress={() => setInitState(prev => ({ ...prev, isReady: true }))}
              >
                <Text style={styles.skipButtonText}>Continue Anyway</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
        
        {/* Health Status Indicator */}
        {initState.healthStatus && (
          <View style={styles.healthIndicator}>
            <Text style={styles.healthText}>
              📊 {initState.healthStatus.initialized ? 'Services Ready' : 'Partial Initialization'}
            </Text>
            {!initState.healthStatus.network.online && (
              <Text style={styles.offlineText}>📱 Offline Mode Available</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  // Don't render main app until ready
  if (!initState.isReady) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        {renderInitializationScreen()}
      </SafeAreaProvider>
    );
  }

  // Render main app with Phase 2 enhancements
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('🚨 App-level error caught by boundary:', error, errorInfo);
      }}
      enableRetry={true}
      maxRetries={3}
      showDetails={__DEV__}
    >
      <Provider store={store}>
        <PersistGate 
          loading={
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Restoring your data...</Text>
            </View>
          } 
          persistor={persistor}
        >
          <SafeAreaProvider>
            <NavigationContainer>
              <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
              
              <SafeAreaView style={styles.container}>
                {/* Global Offline Indicator */}
                <OfflineIndicator 
                  position="top" 
                  showWhenOnline={false}
                  compact={true}
                />
                
                {/* Main Navigation */}
                <AppNavigator />
                
                {/* Health Status Debug Info (Development Only) */}
                {__DEV__ && initState.healthStatus && (
                  <View style={styles.debugInfo}>
                    <Text style={styles.debugText}>
                      🔍 Debug: {initState.healthStatus.sync.healthy ? '✅' : '⚠️'} Sync | 
                      {initState.healthStatus.notifications.enabled ? '🔔' : '🔕'} Notifications |
                      {initState.healthStatus.network.online ? '🌐' : '📱'} {initState.healthStatus.network.online ? 'Online' : 'Offline'}
                    </Text>
                  </View>
                )}
              </SafeAreaView>
            </NavigationContainer>
          </SafeAreaProvider>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  initContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  initContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 64,
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  loader: {
    marginVertical: 20,
  },
  initText: {
    fontSize: 16,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  initSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.error,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  skipButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  healthIndicator: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  healthText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  offlineText: {
    fontSize: 12,
    color: COLORS.warning,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.text.primary,
    marginTop: 16,
  },
  debugInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  debugText: {
    fontSize: 10,
    color: '#fff',
    textAlign: 'center',
  },
});

export default EnhancedApp;
