/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

// Import polyfills first
import 'react-native-url-polyfill/auto';
import React from 'react';
import { StatusBar, StyleSheet, SafeAreaView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import AppNavigator from './navigation/AppNavigator';
import { store, persistor } from './store';
import { COLORS } from './constants/colors';

/**
 * KrishiVeda - A farming app for Nepali farmers
 * Main Application Component
 */

const App: React.FC = () => {
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
});

export default App;
