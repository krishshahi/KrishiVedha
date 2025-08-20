/**
 * Dynamic Theme System for KrishiVedha Client
 * Comprehensive theming with light/dark modes and customization
 */

import { Appearance, ColorSchemeName } from 'react-native';
import { getConfig, updateConfig, subscribeToConfig } from './dynamicConfig';

// Theme interfaces
interface ColorPalette {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  secondaryDark: string;
  secondaryLight: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  error: string;
  info: string;
  background: string;
  backgroundDark: string;
  surface: string;
  card: string;
  text: {
    primary: string;
    secondary: string;
    primaryLight: string;
    primaryWhite: string;
  };
  border: string;
  disabled: string;
  placeholder: string;
  highlight: string;
  white: string;
  black: string;
}

interface Typography {
  fontSizes: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };
  fontWeights: {
    light: string;
    regular: string;
    medium: string;
    bold: string;
  };
  lineHeights: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  fontFamilies: {
    primary: string;
    secondary: string;
    mono: string;
  };
}

interface Spacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

interface BorderRadius {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  round: number;
}

interface Shadows {
  small: any;
  medium: any;
  large: any;
}

interface DynamicTheme {
  colors: ColorPalette;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  shadows: Shadows;
  mode: 'light' | 'dark';
  animations: {
    duration: {
      fast: number;
      normal: number;
      slow: number;
    };
    easing: string;
  };
}

// Light theme colors
const LIGHT_COLORS: ColorPalette = {
  primary: '#4CAF50',
  primaryDark: '#388E3C',
  primaryLight: '#C8E6C9',
  secondary: '#FFC107',
  secondaryDark: '#FFA000',
  secondaryLight: '#FFECB3',
  accent: '#2196F3',
  success: '#43A047',
  warning: '#FF9800',
  danger: '#F44336',
  error: '#F44336',
  info: '#03A9F4',
  background: '#FFFFFF',
  backgroundDark: '#F5F5F5',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: {
    primary: '#212121',
    secondary: '#757575',
    primaryLight: '#757575',
    primaryWhite: '#FFFFFF',
  },
  border: '#E0E0E0',
  disabled: '#BDBDBD',
  placeholder: '#9E9E9E',
  highlight: '#B2DFDB',
  white: '#FFFFFF',
  black: '#000000',
};

// Dark theme colors
const DARK_COLORS: ColorPalette = {
  primary: '#66BB6A',
  primaryDark: '#388E3C',
  primaryLight: '#A5D6A7',
  secondary: '#FFD54F',
  secondaryDark: '#FFA000',
  secondaryLight: '#FFF8E1',
  accent: '#64B5F6',
  success: '#66BB6A',
  warning: '#FFB74D',
  danger: '#EF5350',
  error: '#EF5350',
  info: '#42A5F5',
  background: '#121212',
  backgroundDark: '#000000',
  surface: '#1E1E1E',
  card: '#2D2D2D',
  text: {
    primary: '#FFFFFF',
    secondary: '#B3B3B3',
    primaryLight: '#E0E0E0',
    primaryWhite: '#FFFFFF',
  },
  border: '#333333',
  disabled: '#666666',
  placeholder: '#888888',
  highlight: '#4CAF50',
  white: '#FFFFFF',
  black: '#000000',
};

// Base typography (same for both themes)
const BASE_TYPOGRAPHY: Typography = {
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 30,
  },
  fontWeights: {
    light: '300',
    regular: '400',
    medium: '500',
    bold: '700',
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  fontFamilies: {
    primary: 'System',
    secondary: 'System',
    mono: 'Menlo',
  },
};

// Base spacing (same for both themes)
const BASE_SPACING: Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

// Base border radius (same for both themes)
const BASE_BORDER_RADIUS: BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 999,
};

// Light theme shadows
const LIGHT_SHADOWS: Shadows = {
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

// Dark theme shadows
const DARK_SHADOWS: Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 8,
  },
};

class DynamicThemeManager {
  private static instance: DynamicThemeManager;
  private currentTheme: DynamicTheme;
  private listeners: Array<(theme: DynamicTheme) => void> = [];
  private systemColorScheme: ColorSchemeName = 'light';
  
  private constructor() {
    this.systemColorScheme = Appearance.getColorScheme();
    this.currentTheme = this.createTheme('light');
    this.initialize();
  }
  
  public static getInstance(): DynamicThemeManager {
    if (!DynamicThemeManager.instance) {
      DynamicThemeManager.instance = new DynamicThemeManager();
    }
    return DynamicThemeManager.instance;
  }
  
  private async initialize() {
    // Listen to system color scheme changes
    Appearance.addChangeListener(this.handleSystemColorSchemeChange);
    
    // Subscribe to config changes
    subscribeToConfig((config) => {
      this.updateThemeFromConfig(config);
    });
    
    // Initialize theme based on current config
    const config = getConfig();
    this.updateThemeFromConfig(config);
  }
  
  private handleSystemColorSchemeChange = (preferences: { colorScheme: ColorSchemeName }) => {
    this.systemColorScheme = preferences.colorScheme;
    
    const config = getConfig();
    if (config.ui.theme.mode === 'auto') {
      this.updateThemeFromConfig(config);
    }
  };
  
  private updateThemeFromConfig(config: any) {
    const themeMode = this.resolveThemeMode(config.ui.theme.mode);
    const newTheme = this.createTheme(themeMode, config);
    
    if (JSON.stringify(newTheme) !== JSON.stringify(this.currentTheme)) {
      this.currentTheme = newTheme;
      this.notifyListeners();
    }
  }
  
  private resolveThemeMode(configMode: string): 'light' | 'dark' {
    if (configMode === 'auto') {
      return this.systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return configMode === 'dark' ? 'dark' : 'light';
  }
  
  private createTheme(mode: 'light' | 'dark', config?: any): DynamicTheme {
    const baseColors = mode === 'dark' ? DARK_COLORS : LIGHT_COLORS;
    const baseShadows = mode === 'dark' ? DARK_SHADOWS : LIGHT_SHADOWS;
    
    // Apply custom colors from config if available
    const colors: ColorPalette = { ...baseColors };
    if (config?.ui?.theme) {
      if (config.ui.theme.primaryColor) colors.primary = config.ui.theme.primaryColor;
      if (config.ui.theme.secondaryColor) colors.secondary = config.ui.theme.secondaryColor;
      if (config.ui.theme.accentColor) colors.accent = config.ui.theme.accentColor;
    }
    
    // Apply custom typography from config if available
    const typography: Typography = { ...BASE_TYPOGRAPHY };
    if (config?.ui?.typography) {
      if (config.ui.typography.fontSizes) {
        typography.fontSizes = { ...typography.fontSizes, ...config.ui.typography.fontSizes };
      }
      if (config.ui.typography.fontWeights) {
        typography.fontWeights = { ...typography.fontWeights, ...config.ui.typography.fontWeights };
      }
      if (config.ui.typography.lineHeights) {
        typography.lineHeights = { ...typography.lineHeights, ...config.ui.typography.lineHeights };
      }
    }
    
    // Apply custom spacing from config if available
    const spacing: Spacing = { ...BASE_SPACING };
    if (config?.ui?.layout?.spacing) {
      Object.assign(spacing, config.ui.layout.spacing);
    }
    
    // Apply custom border radius from config if available
    const borderRadius: BorderRadius = { ...BASE_BORDER_RADIUS };
    if (config?.ui?.layout?.borderRadius) {
      Object.assign(borderRadius, config.ui.layout.borderRadius);
    }
    
    return {
      colors,
      typography,
      spacing,
      borderRadius,
      shadows: baseShadows,
      mode,
      animations: config?.ui?.animations || {
        duration: {
          fast: 200,
          normal: 300,
          slow: 500,
        },
        easing: 'ease-in-out',
      },
    };
  }
  
  public getTheme(): DynamicTheme {
    return { ...this.currentTheme };
  }
  
  public setThemeMode(mode: 'light' | 'dark' | 'auto'): void {
    updateConfig({
      ui: {
        theme: {
          mode,
        },
      },
    });
  }
  
  public setCustomColors(colors: Partial<ColorPalette>): void {
    const config = getConfig();
    updateConfig({
      ui: {
        theme: {
          ...config.ui.theme,
          primaryColor: colors.primary || config.ui.theme.primaryColor,
          secondaryColor: colors.secondary || config.ui.theme.secondaryColor,
          accentColor: colors.accent || config.ui.theme.accentColor,
        },
      },
    });
  }
  
  public setTypography(typography: Partial<Typography>): void {
    const config = getConfig();
    updateConfig({
      ui: {
        ...config.ui,
        typography: {
          ...config.ui.typography,
          ...typography,
        },
      },
    });
  }
  
  public setSpacing(spacing: Partial<Spacing>): void {
    const config = getConfig();
    updateConfig({
      ui: {
        ...config.ui,
        layout: {
          ...config.ui.layout,
          spacing: {
            ...config.ui.layout.spacing,
            ...spacing,
          },
        },
      },
    });
  }
  
  public resetTheme(): void {
    updateConfig({
      ui: {
        theme: {
          mode: 'auto',
          primaryColor: '#4CAF50',
          secondaryColor: '#FFC107',
          accentColor: '#2196F3',
        },
      },
    });
  }
  
  public subscribe(listener: (theme: DynamicTheme) => void): () => void {
    this.listeners.push(listener);
    // Call listener immediately with current theme
    listener(this.currentTheme);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentTheme);
      } catch (error) {
        console.error('Theme listener error:', error);
      }
    });
  }
  
  public generateColorVariants(baseColor: string): { light: string; dark: string; contrast: string } {
    // Simple color variant generation (could be enhanced with proper color manipulation library)
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      } : null;
    };
    
    const rgbToHex = (r: number, g: number, b: number) => {
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };
    
    const rgb = hexToRgb(baseColor);
    if (!rgb) return { light: baseColor, dark: baseColor, contrast: '#FFFFFF' };
    
    const lightColor = rgbToHex(
      Math.min(255, rgb.r + 50),
      Math.min(255, rgb.g + 50),
      Math.min(255, rgb.b + 50)
    );
    
    const darkColor = rgbToHex(
      Math.max(0, rgb.r - 50),
      Math.max(0, rgb.g - 50),
      Math.max(0, rgb.b - 50)
    );
    
    // Simple luminance calculation for contrast
    const luminance = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
    const contrastColor = luminance > 128 ? '#000000' : '#FFFFFF';
    
    return {
      light: lightColor,
      dark: darkColor,
      contrast: contrastColor,
    };
  }
}

// Singleton instance
export const themeManager = DynamicThemeManager.getInstance();

// Hook for React components
export const useDynamicTheme = () => {
  const [theme, setTheme] = React.useState<DynamicTheme>(themeManager.getTheme());
  
  React.useEffect(() => {
    return themeManager.subscribe(setTheme);
  }, []);
  
  return theme;
};

// Utility functions
export const createStyleSheet = (styleFactory: (theme: DynamicTheme) => any) => {
  return (theme: DynamicTheme) => styleFactory(theme);
};

export const withDynamicTheme = <P extends object>(
  Component: React.ComponentType<P & { theme: DynamicTheme }>
) => {
  return (props: P) => {
    const theme = useDynamicTheme();
    return <Component {...props} theme={theme} />;
  };
};

// Export types
export type { DynamicTheme, ColorPalette, Typography, Spacing, BorderRadius, Shadows };

// Export main functions
export {
  themeManager as default,
  DynamicThemeManager,
};

// Need to import React for hooks
import React from 'react';
