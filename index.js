/**
 * @format
 */

// Setup polyfills first
import './src/utils/polyfills';
import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import App from './src/App';

// For Expo projects, the app name should be 'main'
AppRegistry.registerComponent('main', () => App);
