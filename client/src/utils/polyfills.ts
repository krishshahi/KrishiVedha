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

// Add better error handling for theme constants
if (!global.themeInitialized) {
  global.themeInitialized = false;
  
  // Define a global error handler for theme issues
  global.handleThemeError = (error, context) => {
    console.error('🎨 Theme Error:', error, 'Context:', context);
    
    // Return safe defaults to prevent crashes
    return {
      md: 16,
      sm: 8,
      lg: 24,
      xs: 4,
      xl: 32,
      xxl: 40,
      xxxl: 48
    };
  };
}

export default {};

