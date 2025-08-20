/**
 * KrishiVeda App Color Palette
 */

export const COLORS = {
  // Primary colors
  primary: '#4CAF50', // Green - representing agriculture and growth
  primaryDark: '#388E3C',
  primaryLight: '#C8E6C9',
  
  // Secondary colors
  secondary: '#FFC107', // Amber - representing sunshine and harvest
  secondaryDark: '#FFA000',
  secondaryLight: '#FFECB3',
  
  // Accent color
  accent: '#2196F3', // Blue - representing water and sky
  
  // Alert colors
  success: '#43A047',
  warning: '#FF9800',
  danger: '#F44336',
  error: '#F44336',
  info: '#03A9F4',
  
  // Background colors
  background: '#FFFFFF',
  backgroundDark: '#F5F5F5',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  
  // Text colors
  text: {
    primary: '#212121',
    secondary: '#757575',
    primaryLight: '#757575',
    primaryWhite: '#FFFFFF',
  },
  textLight: '#757575',
  textWhite: '#FFFFFF',
  textSecondary: '#757575',
  
  // Additional colors
  white: '#FFFFFF',
  backgroundLight: '#F8F9FA',
  
  // Border colors
  border: '#E0E0E0',
  
  // Miscellaneous
  disabled: '#BDBDBD',
  placeholder: '#9E9E9E',
  highlight: '#B2DFDB',
};

// Safety check for COLORS
if (!COLORS || !COLORS.text || !COLORS.text.primary) {
  console.error('❌ COLORS constants not properly initialized:', COLORS);
  throw new Error('COLORS constants failed to initialize properly');
}

// Freeze the colors object to prevent accidental mutations
Object.freeze(COLORS.text);
Object.freeze(COLORS);


export default COLORS;

