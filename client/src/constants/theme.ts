import { COLORS } from './colors';

// Re-export COLORS for convenience
export { COLORS };


/**
 * KrishiVeda App Theme
 * Defines spacing, typography, and other theme elements
 */

// Safe font sizes with fallbacks
const createFontSizes = () => {
  try {
    return {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 30,
    };
  } catch (error) {
    console.error('⚠️ Error creating font sizes:', error);
    return {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 30,
    };
  }
};

// Safe spacing with fallbacks
const createSpacing = () => {
  try {
    return {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 40,
    };
  } catch (error) {
    console.error('⚠️ Error creating spacing:', error);
    return {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 40,
    };
  }
};

// Create font sizes safely
const fontSizes = createFontSizes();

// Safe font object with error handling
export const FONTS = {
  // Font families (can be customized with actual font names when added to the project)
  regular: 'System',
  medium: 'System-Medium',
  bold: 'System-Bold',
  
  // Font sizes
  size: fontSizes,
};

// Safe spacing object with error handling
export const SPACING = createSpacing();

// Ensure the objects are properly defined and frozen
try {
  if (FONTS && FONTS.size) {
    Object.freeze(FONTS.size);
    Object.freeze(FONTS);
  }
  if (SPACING) {
    Object.freeze(SPACING);
  }
} catch (error) {
  console.error('⚠️ Error freezing theme objects:', error);
}

// Safety check exports with better error handling
if (!FONTS || !FONTS.size || !SPACING) {
  console.error('❌ Theme constants not properly initialized:', { FONTS, SPACING });
  console.error('❌ FONTS.size:', FONTS ? FONTS.size : 'FONTS is undefined');
  console.error('❌ SPACING:', SPACING);
  
  // Instead of throwing, provide fallbacks
  if (!FONTS) {
    console.warn('⚠️ Using fallback FONTS');
  }
  if (!FONTS?.size) {
    console.warn('⚠️ Using fallback FONTS.size');
  }
  if (!SPACING) {
    console.warn('⚠️ Using fallback SPACING');
  }
}

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 999,
};

// App theme combining all elements
export const THEME = {
  colors: COLORS,
  fonts: FONTS,
  spacing: SPACING,
  shadows: SHADOWS,
  borderRadius: BORDER_RADIUS,
};

export default THEME;

