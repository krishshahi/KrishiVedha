/**
 * @format
 */

// Setup polyfills first
import './src/utils/polyfills';
import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import App from './src/App.tsx';

// For Expo projects, the app name should match the slug in app.json
AppRegistry.registerComponent('krishiveda', () => App);
// Also register as 'main' for Expo compatibility
AppRegistry.registerComponent('main', () => App);
