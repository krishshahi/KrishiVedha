// React Native polyfills for missing web APIs
import 'react-native-url-polyfill/auto';

// Global polyfills that might be needed
if (typeof global.URL === 'undefined') {
  global.URL = require('react-native-url-polyfill').URL;
}

// Additional polyfills for better compatibility
if (typeof global.URLSearchParams === 'undefined') {
  global.URLSearchParams = require('react-native-url-polyfill').URLSearchParams;
}

// Console polyfill for better debugging
if (!global.console) {
  global.console = {
    log: () => {},
    warn: () => {},
    error: () => {},
    info: () => {},
    debug: () => {},
  };
}

export default {};

