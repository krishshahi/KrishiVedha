/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

// Import polyfills first
import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, SafeAreaView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import AuthNavigator from './navigation/AuthNavigator';
import { AuthProvider, useAuth } from './context/AuthContext';
import { COLORS } from './constants/colors';
import { THEME } from './constants/theme';

/**
 * KrishiVeda - A farming app for Nepali farmers
 * Main Application Component
 */

// Component that uses auth context to conditionally render navigators
function AppContent(): React.JSX.Element {
  const { user } = useAuth();

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.primary}
        />
        <SafeAreaView style={styles.container}>
          {user ? <AppNavigator /> : <AuthNavigator />}
        </SafeAreaView>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// Main App component that wraps everything with AuthProvider
function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});

export default App;
