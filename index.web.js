/**
 * @format
 */

// Setup polyfills first
import './src/utils/polyfills';
import { AppRegistry } from 'react-native';
import App from './src/App';

// For web, the app name should be 'main'
AppRegistry.registerComponent('main', () => App);
AppRegistry.runApplication('main', {
  rootTag: document.getElementById('root'),
});
