import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorScheme = 'default' | 'nature' | 'ocean' | 'sunset' | 'forest' | 'custom';
export type FontSize = 'small' | 'medium' | 'large' | 'extra-large';

// Color palette interface
export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  success: string;
  warning: string;
  error: string;
  info: string;
  border: string;
}

// Theme presets
const colorSchemes: Record<ColorScheme, Partial<ColorPalette>> = {
  default: {
    primary: '#4CAF50',
    secondary: '#FFC107',
    accent: '#FF5722',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
  },
  nature: {
    primary: '#66BB6A',
    secondary: '#8BC34A',
    accent: '#CDDC39',
    success: '#43A047',
    warning: '#FFB300',
    error: '#E53935',
    info: '#29B6F6',
  },
  ocean: {
    primary: '#0288D1',
    secondary: '#00BCD4',
    accent: '#00ACC1',
    success: '#00897B',
    warning: '#FFA726',
    error: '#EF5350',
    info: '#039BE5',
  },
  sunset: {
    primary: '#FF6B6B',
    secondary: '#FFE66D',
    accent: '#FF8E53',
    success: '#4ECDC4',
    warning: '#FFD93D',
    error: '#E74C3C',
    info: '#6C5CE7',
  },
  forest: {
    primary: '#2E7D32',
    secondary: '#558B2F',
    accent: '#33691E',
    success: '#1B5E20',
    warning: '#F9A825',
    error: '#C62828',
    info: '#1565C0',
  },
  custom: {
    // User-defined colors
  },
};

// Font size scales
const fontSizeScales = {
  small: 0.85,
  medium: 1.0,
  large: 1.15,
  'extra-large': 1.3,
};

// Theme settings interface
export interface ThemeSettings {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  customColors?: Partial<ColorPalette>;
  fontSize: FontSize;
  fontFamily?: string;
  roundedCorners: boolean;
  animations: boolean;
  highContrast: boolean;
}

// Theme context interface
interface ThemeContextType {
  theme: ColorPalette;
  settings: ThemeSettings;
  isDarkMode: boolean;
  fontScale: number;
  
  // Actions
  setThemeMode: (mode: ThemeMode) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  setCustomColors: (colors: Partial<ColorPalette>) => void;
  setFontSize: (size: FontSize) => void;
  toggleRoundedCorners: () => void;
  toggleAnimations: () => void;
  toggleHighContrast: () => void;
  resetTheme: () => void;
}

// Default theme settings
const defaultSettings: ThemeSettings = {
  mode: 'system',
  colorScheme: 'default',
  fontSize: 'medium',
  roundedCorners: true,
  animations: true,
  highContrast: false,
};

// Create context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Storage keys
const THEME_STORAGE_KEY = '@krishivedha_theme_settings';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(defaultSettings);
  const [systemColorScheme, setSystemColorScheme] = useState(
    Appearance.getColorScheme() || 'light'
  );

  // Load saved settings on mount
  useEffect(() => {
    loadSettings();

    // Listen for system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme || 'light');
    });

    return () => subscription?.remove();
  }, []);

  // Save settings whenever they change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Load settings from storage
  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading theme settings:', error);
    }
  };

  // Save settings to storage
  const saveSettings = async (newSettings: ThemeSettings) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving theme settings:', error);
    }
  };

  // Determine if dark mode is active
  const isDarkMode = 
    settings.mode === 'dark' || 
    (settings.mode === 'system' && systemColorScheme === 'dark');

  // Generate theme based on settings
  const generateTheme = (): ColorPalette => {
    const baseColors = {
      ...colorSchemes[settings.colorScheme],
      ...settings.customColors,
    };

    const theme: ColorPalette = {
      primary: baseColors.primary || '#4CAF50',
      secondary: baseColors.secondary || '#FFC107',
      accent: baseColors.accent || '#FF5722',
      success: baseColors.success || '#4CAF50',
      warning: baseColors.warning || '#FF9800',
      error: baseColors.error || '#F44336',
      info: baseColors.info || '#2196F3',
      
      // Dynamic based on dark mode
      background: isDarkMode ? '#121212' : '#FFFFFF',
      surface: isDarkMode ? '#1E1E1E' : '#F5F5F5',
      border: isDarkMode ? '#333333' : '#E0E0E0',
      
      text: {
        primary: isDarkMode ? '#FFFFFF' : '#212121',
        secondary: isDarkMode ? '#B0B0B0' : '#757575',
        disabled: isDarkMode ? '#606060' : '#9E9E9E',
      },
    };

    // Apply high contrast if enabled
    if (settings.highContrast) {
      if (isDarkMode) {
        theme.text.primary = '#FFFFFF';
        theme.text.secondary = '#E0E0E0';
        theme.background = '#000000';
      } else {
        theme.text.primary = '#000000';
        theme.text.secondary = '#424242';
        theme.background = '#FFFFFF';
      }
    }

    return theme;
  };

  // Action handlers
  const setThemeMode = (mode: ThemeMode) => {
    setSettings(prev => ({ ...prev, mode }));
  };

  const setColorScheme = (colorScheme: ColorScheme) => {
    setSettings(prev => ({ ...prev, colorScheme }));
  };

  const setCustomColors = (customColors: Partial<ColorPalette>) => {
    setSettings(prev => ({ 
      ...prev, 
      colorScheme: 'custom',
      customColors: { ...prev.customColors, ...customColors }
    }));
  };

  const setFontSize = (fontSize: FontSize) => {
    setSettings(prev => ({ ...prev, fontSize }));
  };

  const toggleRoundedCorners = () => {
    setSettings(prev => ({ ...prev, roundedCorners: !prev.roundedCorners }));
  };

  const toggleAnimations = () => {
    setSettings(prev => ({ ...prev, animations: !prev.animations }));
  };

  const toggleHighContrast = () => {
    setSettings(prev => ({ ...prev, highContrast: !prev.highContrast }));
  };

  const resetTheme = () => {
    setSettings(defaultSettings);
  };

  const value: ThemeContextType = {
    theme: generateTheme(),
    settings,
    isDarkMode,
    fontScale: fontSizeScales[settings.fontSize],
    
    // Actions
    setThemeMode,
    setColorScheme,
    setCustomColors,
    setFontSize,
    toggleRoundedCorners,
    toggleAnimations,
    toggleHighContrast,
    resetTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use theme
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Export default theme for non-context usage
export const defaultTheme: ColorPalette = {
  primary: '#4CAF50',
  secondary: '#FFC107',
  accent: '#FF5722',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: {
    primary: '#212121',
    secondary: '#757575',
    disabled: '#9E9E9E',
  },
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  border: '#E0E0E0',
};
