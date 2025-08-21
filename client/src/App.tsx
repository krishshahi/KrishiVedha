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
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import AppNavigator from './navigation/AppNavigator';
import { store, persistor } from './store';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { useDynamicTheme } from './config/dynamicTheme';
import { useDynamicI18n } from './config/dynamicI18n';
import { appInitService } from './services/appInitService';
import { mlCropAnalysisService } from './services/mlCropAnalysisService';
import { iotIntegrationService } from './services/iotIntegrationService';
import { pushNotificationService } from './services/pushNotificationService';
import FloatingChatbot from './components/FloatingChatbot';

/**
 * KrishiVeda - A comprehensive farming app for modern agriculture
 * Features: ML Analytics, IoT Integration, Offline-First, Real-time Sync
 */

// Theme Provider Component
const ThemedApp: React.FC = () => {
  const theme = useDynamicTheme();
  const { t } = useDynamicI18n();
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('🚀 Starting KrishiVeda Enhanced App with Dynamic Configuration...');
      
      // Initialize core app services
      await appInitService.initialize({
        enableOfflineSupport: true,
        enablePushNotifications: true,
        enableErrorReporting: true,
        autoSyncOnInit: true,
        backgroundSync: true,
      });
      
      console.log('🎨 Dynamic Theme Mode:', theme.mode);
      console.log('🌍 Current Language:', t('common.loading'));

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
    const dynamicStyles = createDynamicStyles(theme);
    
    return (
      <SafeAreaProvider>
        <View style={dynamicStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={dynamicStyles.loadingTitle}>KrishiVeda</Text>
          <Text style={dynamicStyles.loadingSubtitle}>{t('common.loading')}</Text>
          <Text style={dynamicStyles.loadingText}>Initializing ML Analytics & IoT Systems...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  // Error screen if initialization failed
  if (initError) {
    const dynamicStyles = createDynamicStyles(theme);
    
    return (
      <SafeAreaProvider>
        <View style={dynamicStyles.errorContainer}>
          <Text style={dynamicStyles.errorTitle}>⚠️ {t('errors.unknownError')}</Text>
          <Text style={dynamicStyles.errorText}>{initError}</Text>
          <Text style={dynamicStyles.errorSubtext}>{t('errors.tryAgain')}</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  const dynamicStyles = createDynamicStyles(theme);
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar 
            barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} 
            backgroundColor={theme.colors.primary} 
          />
          <SafeAreaView style={dynamicStyles.container}>
            <AppNavigator />
          </SafeAreaView>
          <FloatingChatbot />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

// Dynamic styles function that creates styles based on current theme
const createDynamicStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  loadingTitle: {
    fontSize: theme.typography.fontSizes.xxxl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  loadingSubtitle: {
    fontSize: theme.typography.fontSizes.lg,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
  },
  loadingText: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  errorTitle: {
    fontSize: theme.typography.fontSizes.xxl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.error,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  errorSubtext: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});

// Main App component with theme and i18n providers
const App: React.FC = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider>
          <ThemedApp />
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
};

export default App;
