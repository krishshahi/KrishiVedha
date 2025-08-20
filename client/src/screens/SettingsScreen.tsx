/**
 * Dynamic Settings Screen for KrishiVedha
 * Allows users to change theme, language, and other configurations in real-time
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useDynamicTheme, themeManager } from '../config/dynamicTheme';
import { useDynamicI18n, SUPPORTED_LANGUAGES } from '../config/dynamicI18n';
import { getConfig, updateConfig } from '../config/dynamicConfig';

const SettingsScreen: React.FC = () => {
  const theme = useDynamicTheme();
  const { t, language, changeLanguage, supportedLanguages } = useDynamicI18n();
  const config = getConfig();

  const styles = createDynamicStyles(theme);

  const handleThemeChange = (mode: 'light' | 'dark' | 'auto') => {
    themeManager.setThemeMode(mode);
    Alert.alert(
      t('settings.theme'),
      `${t('settings.theme')} ${mode === 'light' ? t('settings.lightTheme') : mode === 'dark' ? t('settings.darkTheme') : t('settings.autoTheme')}`,
      [{ text: t('common.ok') }]
    );
  };

  const handleLanguageChange = (langCode: string) => {
    changeLanguage(langCode as any);
    Alert.alert(
      t('settings.language'),
      `${t('settings.language')}: ${SUPPORTED_LANGUAGES[langCode as keyof typeof SUPPORTED_LANGUAGES].nativeName}`,
      [{ text: t('common.ok') }]
    );
  };

  const handleFeatureToggle = (featureKey: string, value: boolean) => {
    updateConfig({
      features: {
        ...config.features,
        [featureKey]: value,
      },
    });
  };

  const handleColorChange = (colorType: 'primary' | 'secondary' | 'accent') => {
    const colors = {
      primary: ['#4CAF50', '#2196F3', '#9C27B0', '#FF5722', '#795548'],
      secondary: ['#FFC107', '#FF9800', '#E91E63', '#607D8B', '#009688'],
      accent: ['#2196F3', '#4CAF50', '#FF5722', '#9C27B0', '#FF9800'],
    };

    const colorOptions = colors[colorType];
    const currentIndex = colorOptions.findIndex(c => c === theme.colors[colorType]);
    const nextIndex = (currentIndex + 1) % colorOptions.length;
    const newColor = colorOptions[nextIndex];

    themeManager.setCustomColors({
      [colorType]: newColor,
    });

    Alert.alert(
      `${colorType.charAt(0).toUpperCase() + colorType.slice(1)} Color`,
      `Changed to ${newColor}`,
      [{ text: t('common.ok') }]
    );
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderSettingRow = (
    title: string,
    subtitle?: string,
    onPress?: () => void,
    rightComponent?: React.ReactNode
  ) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <Text style={styles.headerSubtitle}>Customize your KrishiVedha experience</Text>
      </View>

      {renderSection(
        t('settings.theme'),
        <>
          {renderSettingRow(
            t('settings.lightTheme'),
            'Switch to light theme',
            () => handleThemeChange('light'),
            <View style={[styles.colorPreview, { backgroundColor: '#FFFFFF', borderColor: '#E0E0E0', borderWidth: 1 }]} />
          )}
          {renderSettingRow(
            t('settings.darkTheme'),
            'Switch to dark theme',
            () => handleThemeChange('dark'),
            <View style={[styles.colorPreview, { backgroundColor: '#121212' }]} />
          )}
          {renderSettingRow(
            t('settings.autoTheme'),
            'Follow system theme',
            () => handleThemeChange('auto'),
            <View style={[styles.colorPreview, { backgroundColor: theme.mode === 'dark' ? '#121212' : '#FFFFFF' }]} />
          )}
        </>
      )}

      {renderSection(
        'Color Customization',
        <>
          {renderSettingRow(
            'Primary Color',
            'Main app color',
            () => handleColorChange('primary'),
            <View style={[styles.colorPreview, { backgroundColor: theme.colors.primary }]} />
          )}
          {renderSettingRow(
            'Secondary Color',
            'Accent color',
            () => handleColorChange('secondary'),
            <View style={[styles.colorPreview, { backgroundColor: theme.colors.secondary }]} />
          )}
          {renderSettingRow(
            'Accent Color',
            'Highlight color',
            () => handleColorChange('accent'),
            <View style={[styles.colorPreview, { backgroundColor: theme.colors.accent }]} />
          )}
        </>
      )}

      {renderSection(
        t('settings.language'),
        <>
          {Object.entries(supportedLanguages).map(([code, info]) => (
            <TouchableOpacity
              key={code}
              style={[
                styles.languageRow,
                language === code && styles.languageRowActive
              ]}
              onPress={() => handleLanguageChange(code)}
            >
              <View>
                <Text style={[
                  styles.languageTitle,
                  language === code && styles.languageTitleActive
                ]}>
                  {info.nativeName}
                </Text>
                <Text style={[
                  styles.languageSubtitle,
                  language === code && styles.languageSubtitleActive
                ]}>
                  {info.name}
                </Text>
              </View>
              {language === code && (
                <View style={styles.activeIndicator} />
              )}
            </TouchableOpacity>
          ))}
        </>
      )}

      {renderSection(
        'Features',
        <>
          {Object.entries(config.features).map(([key, value]) => (
            <View key={key} style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Text>
                <Text style={styles.settingSubtitle}>
                  {value ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
              <Switch
                value={value}
                onValueChange={(newValue) => handleFeatureToggle(key, newValue)}
                trackColor={{ false: theme.colors.disabled, true: theme.colors.primary }}
                thumbColor={value ? theme.colors.white : theme.colors.placeholder}
              />
            </View>
          ))}
        </>
      )}

      {renderSection(
        'App Information',
        <>
          {renderSettingRow(
            t('settings.version'),
            config.app.version,
          )}
          {renderSettingRow(
            'Environment',
            config.app.environment,
          )}
          {renderSettingRow(
            'Theme Mode',
            `${theme.mode} (${theme.colors.primary})`,
          )}
          {renderSettingRow(
            'Current Language',
            SUPPORTED_LANGUAGES[language].nativeName,
          )}
        </>
      )}
    </ScrollView>
  );
};

const createDynamicStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.typography.fontSizes.xxl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text.secondary,
  },
  section: {
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.text.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.backgroundDark,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs / 2,
  },
  settingSubtitle: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: theme.spacing.md,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  languageRowActive: {
    backgroundColor: theme.colors.primaryLight,
  },
  languageTitle: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.text.primary,
  },
  languageTitleActive: {
    color: theme.colors.primary,
  },
  languageSubtitle: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs / 2,
  },
  languageSubtitleActive: {
    color: theme.colors.primaryDark,
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
});

export default SettingsScreen;
