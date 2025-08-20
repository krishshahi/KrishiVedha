/**
 * KrishiVeda - Advanced Agricultural Management App
 * Enhanced with ML Analytics, IoT Integration & Offline-First Architecture
 * @format
 */

// Import polyfills first
import 'react-native-url-polyfill/auto';
import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, SafeAreaView, View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import AppNavigator from './navigation/AppNavigator';
import { store, persistor } from './store';
import { COLORS } from './constants/colors';
import { appInitService } from './services/appInitService';
import { mlCropAnalysisService } from './services/mlCropAnalysisService';
import { iotIntegrationService } from './services/iotIntegrationService';
import { pushNotificationService } from './services/pushNotificationService';

/**
 * KrishiVeda - A comprehensive farming app for modern agriculture
 * Features: ML Analytics, IoT Integration, Offline-First, Real-time Sync
 */

const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('🚀 Starting KrishiVeda Enhanced App...');
      
      // Initialize core app services
      await appInitService.initialize({
        enableOfflineSupport: true,
        enablePushNotifications: true,
        enableErrorReporting: true,
        autoSyncOnInit: true,
        backgroundSync: true,
      });

      // Initialize ML services in parallel
      const mlInitPromise = mlCropAnalysisService.initialize();
      const iotInitPromise = iotIntegrationService.initialize();
      const pushInitPromise = pushNotificationService.initialize();

      await Promise.allSettled([mlInitPromise, iotInitPromise, pushInitPromise]);

      console.log('✅ KrishiVeda App initialization completed successfully');
      setIsInitializing(false);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize app';
      setInitError(errorMessage);
      setIsInitializing(false);
    }
  };

  // Loading screen during initialization
  if (isInitializing) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingTitle}>KrishiVeda</Text>
          <Text style={styles.loadingSubtitle}>Smart Farming Platform</Text>
          <Text style={styles.loadingText}>Initializing ML Analytics & IoT Systems...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  // Error screen if initialization failed
  if (initError) {
    return (
      <SafeAreaProvider>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>⚠️ Initialization Error</Text>
          <Text style={styles.errorText}>{initError}</Text>
          <Text style={styles.errorSubtext}>Please restart the app</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <NavigationContainer>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
            <SafeAreaView style={styles.container}>
              <AppNavigator />
            </SafeAreaView>
          </NavigationContainer>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  loadingTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 20,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 18,
    color: COLORS.text.secondary,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.error,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
});

export default App;
