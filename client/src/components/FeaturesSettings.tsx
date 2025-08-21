import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import featureFlagsService, { 
  FeatureCategory, 
  FeatureFlag, 
  FEATURE_FLAGS 
} from '../services/featureFlagsService';

interface FeaturesSettingsProps {
  userTier?: 'free' | 'premium';
  onUpgradePress?: () => void;
}

const FeaturesSettings: React.FC<FeaturesSettingsProps> = ({ 
  userTier = 'free',
  onUpgradePress 
}) => {
  const { theme } = useTheme();
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<FeatureCategory>(FeatureCategory.CORE);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<FeatureFlag | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    enabled: 0,
    disabled: 0,
    experimental: 0,
    beta: 0,
    premium: 0,
  });

  // Category icons
  const categoryIcons: Record<FeatureCategory, string> = {
    [FeatureCategory.CORE]: 'settings',
    [FeatureCategory.AI_ML]: 'bulb',
    [FeatureCategory.IOT]: 'hardware-chip',
    [FeatureCategory.SOCIAL]: 'people',
    [FeatureCategory.EXPERIMENTAL]: 'flask',
    [FeatureCategory.BETA]: 'construct',
    [FeatureCategory.PREMIUM]: 'star',
    [FeatureCategory.DEVELOPER]: 'code-slash',
  };

  // Category labels
  const categoryLabels: Record<FeatureCategory, string> = {
    [FeatureCategory.CORE]: 'Core Features',
    [FeatureCategory.AI_ML]: 'AI & ML',
    [FeatureCategory.IOT]: 'IoT & Sensors',
    [FeatureCategory.SOCIAL]: 'Social & Community',
    [FeatureCategory.EXPERIMENTAL]: 'Experimental',
    [FeatureCategory.BETA]: 'Beta Features',
    [FeatureCategory.PREMIUM]: 'Premium',
    [FeatureCategory.DEVELOPER]: 'Developer',
  };

  useEffect(() => {
    initializeFeatures();
  }, []);

  const initializeFeatures = async () => {
    setLoading(true);
    try {
      await featureFlagsService.initialize(userTier);
      
      // Load current feature states
      const featureStates: Record<string, boolean> = {};
      Object.keys(FEATURE_FLAGS).forEach(id => {
        featureStates[id] = featureFlagsService.isEnabled(id);
      });
      
      setFeatures(featureStates);
      setStats(featureFlagsService.getFeatureStatistics());
    } catch (error) {
      console.error('Error initializing features:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureToggle = async (featureId: string) => {
    const feature = FEATURE_FLAGS[featureId];
    
    // Check if premium feature and user is free
    if (feature.requiresPremium && userTier !== 'premium') {
      Alert.alert(
        'Premium Feature',
        'This feature requires a premium subscription. Would you like to upgrade?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Upgrade', 
            onPress: () => onUpgradePress?.(),
            style: 'default'
          },
        ]
      );
      return;
    }

    // Check if feature requires restart
    if (feature.requiresRestart && !features[featureId]) {
      Alert.alert(
        'Restart Required',
        'Enabling this feature requires an app restart. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Enable', 
            onPress: () => toggleFeature(featureId),
            style: 'default'
          },
        ]
      );
      return;
    }

    // Check dependencies
    if (feature.dependencies && !features[featureId]) {
      const missingDeps = feature.dependencies.filter(dep => !features[dep]);
      if (missingDeps.length > 0) {
        const depNames = missingDeps.map(dep => FEATURE_FLAGS[dep]?.name).join(', ');
        Alert.alert(
          'Dependencies Required',
          `This feature requires the following to be enabled first: ${depNames}`,
          [{ text: 'OK' }]
        );
        return;
      }
    }

    toggleFeature(featureId);
  };

  const toggleFeature = async (featureId: string) => {
    const success = await featureFlagsService.toggleFeature(featureId);
    
    if (success) {
      const newState = !features[featureId];
      setFeatures(prev => ({ ...prev, [featureId]: newState }));
      setStats(featureFlagsService.getFeatureStatistics());
      
      // Check if feature requires restart
      const feature = FEATURE_FLAGS[featureId];
      if (feature.requiresRestart && newState) {
        Alert.alert(
          'Restart Required',
          'Please restart the app for changes to take effect.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const showFeatureInfo = (feature: FeatureFlag) => {
    setSelectedFeature(feature);
    setShowInfoModal(true);
  };

  const handleBulkAction = (action: string) => {
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${action}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: action === 'reset' ? 'destructive' : 'default',
          onPress: async () => {
            setLoading(true);
            try {
              switch (action) {
                case 'experimental':
                  await featureFlagsService.enableExperimentalFeatures();
                  break;
                case 'beta':
                  await featureFlagsService.enableBetaFeatures();
                  break;
                case 'reset':
                  await featureFlagsService.resetToDefaults();
                  break;
              }
              await initializeFeatures();
              Alert.alert('Success', 'Features updated successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to update features');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderFeatureItem = (feature: FeatureFlag) => {
    const isEnabled = features[feature.id];
    const isLocked = feature.requiresPremium && userTier !== 'premium';
    
    return (
      <TouchableOpacity
        key={feature.id}
        style={[styles.featureItem, { backgroundColor: theme.surface }]}
        onPress={() => showFeatureInfo(feature)}
        activeOpacity={0.7}
      >
        <View style={styles.featureContent}>
          <View style={styles.featureHeader}>
            <Text style={[styles.featureName, { color: theme.text.primary }]}>
              {feature.name}
            </Text>
            <View style={styles.featureBadges}>
              {feature.experimental && (
                <View style={[styles.badge, { backgroundColor: theme.warning + '20' }]}>
                  <Text style={[styles.badgeText, { color: theme.warning }]}>
                    EXPERIMENTAL
                  </Text>
                </View>
              )}
              {feature.beta && (
                <View style={[styles.badge, { backgroundColor: theme.info + '20' }]}>
                  <Text style={[styles.badgeText, { color: theme.info }]}>
                    BETA
                  </Text>
                </View>
              )}
              {feature.requiresPremium && (
                <View style={[styles.badge, { backgroundColor: theme.accent + '20' }]}>
                  <Ionicons name="star" size={12} color={theme.accent} />
                  <Text style={[styles.badgeText, { color: theme.accent, marginLeft: 4 }]}>
                    PREMIUM
                  </Text>
                </View>
              )}
              {feature.requiresRestart && (
                <Ionicons 
                  name="refresh-circle" 
                  size={16} 
                  color={theme.text.secondary} 
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
          </View>
          
          <Text style={[styles.featureDescription, { color: theme.text.secondary }]}>
            {feature.description}
          </Text>
          
          {feature.dependencies && feature.dependencies.length > 0 && (
            <View style={styles.dependencies}>
              <Ionicons name="link" size={12} color={theme.text.disabled} />
              <Text style={[styles.dependencyText, { color: theme.text.disabled }]}>
                Requires: {feature.dependencies.map(dep => FEATURE_FLAGS[dep]?.name).join(', ')}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.featureToggle}>
          {isLocked ? (
            <TouchableOpacity 
              onPress={() => onUpgradePress?.()}
              style={[styles.upgradeButton, { backgroundColor: theme.accent }]}
            >
              <Ionicons name="lock-closed" size={16} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <Switch
              value={isEnabled}
              onValueChange={() => handleFeatureToggle(feature.id)}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#FFF"
              disabled={loading}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategory = (category: FeatureCategory) => {
    const categoryFeatures = featureFlagsService.getFeaturesByCategory(category);
    const isSelected = selectedCategory === category;
    
    return (
      <TouchableOpacity
        key={category}
        style={[
          styles.categoryTab,
          { 
            backgroundColor: isSelected ? theme.primary : theme.surface,
            borderColor: theme.border,
          }
        ]}
        onPress={() => setSelectedCategory(category)}
      >
        <Ionicons 
          name={categoryIcons[category] as any} 
          size={20} 
          color={isSelected ? '#FFF' : theme.text.primary} 
        />
        <Text style={[
          styles.categoryLabel,
          { color: isSelected ? '#FFF' : theme.text.primary }
        ]}>
          {categoryLabels[category]}
        </Text>
        <View style={[
          styles.categoryCount,
          { backgroundColor: isSelected ? '#FFF' : theme.primary + '20' }
        ]}>
          <Text style={[
            styles.categoryCountText,
            { color: isSelected ? theme.primary : theme.text.primary }
          ]}>
            {categoryFeatures.length}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text.secondary }]}>
          Loading features...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Statistics Header */}
      <View style={[styles.statsContainer, { backgroundColor: theme.surface }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.primary }]}>
            {stats.enabled}
          </Text>
          <Text style={[styles.statLabel, { color: theme.text.secondary }]}>
            Enabled
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.text.primary }]}>
            {stats.total}
          </Text>
          <Text style={[styles.statLabel, { color: theme.text.secondary }]}>
            Total
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.warning }]}>
            {stats.experimental}
          </Text>
          <Text style={[styles.statLabel, { color: theme.text.secondary }]}>
            Experimental
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.info }]}>
            {stats.beta}
          </Text>
          <Text style={[styles.statLabel, { color: theme.text.secondary }]}>
            Beta
          </Text>
        </View>
      </View>

      {/* Category Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
      >
        {Object.values(FeatureCategory).map(renderCategory)}
      </ScrollView>

      {/* Features List */}
      <ScrollView style={styles.featuresContainer}>
        {featureFlagsService.getFeaturesByCategory(selectedCategory).map(renderFeatureItem)}
        
        {/* Bulk Actions */}
        {selectedCategory === FeatureCategory.EXPERIMENTAL && (
          <TouchableOpacity
            style={[styles.bulkAction, { backgroundColor: theme.warning + '20' }]}
            onPress={() => handleBulkAction('experimental')}
          >
            <Ionicons name="flask" size={20} color={theme.warning} />
            <Text style={[styles.bulkActionText, { color: theme.warning }]}>
              Enable All Experimental Features
            </Text>
          </TouchableOpacity>
        )}
        
        {selectedCategory === FeatureCategory.BETA && (
          <TouchableOpacity
            style={[styles.bulkAction, { backgroundColor: theme.info + '20' }]}
            onPress={() => handleBulkAction('beta')}
          >
            <Ionicons name="construct" size={20} color={theme.info} />
            <Text style={[styles.bulkActionText, { color: theme.info }]}>
              Enable All Beta Features
            </Text>
          </TouchableOpacity>
        )}
        
        {selectedCategory === FeatureCategory.DEVELOPER && (
          <TouchableOpacity
            style={[styles.bulkAction, { backgroundColor: theme.error + '20' }]}
            onPress={() => handleBulkAction('reset')}
          >
            <Ionicons name="refresh" size={20} color={theme.error} />
            <Text style={[styles.bulkActionText, { color: theme.error }]}>
              Reset All Features to Default
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Feature Info Modal */}
      <Modal
        visible={showInfoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowInfoModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            {selectedFeature && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.text.primary }]}>
                    {selectedFeature.name}
                  </Text>
                  <TouchableOpacity onPress={() => setShowInfoModal(false)}>
                    <Ionicons name="close" size={24} color={theme.text.secondary} />
                  </TouchableOpacity>
                </View>
                
                <Text style={[styles.modalDescription, { color: theme.text.secondary }]}>
                  {selectedFeature.description}
                </Text>
                
                {selectedFeature.requiresPermission && (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalSectionTitle, { color: theme.text.primary }]}>
                      Required Permissions:
                    </Text>
                    {selectedFeature.requiresPermission.map(permission => (
                      <View key={permission} style={styles.permissionItem}>
                        <Ionicons name="shield-checkmark" size={16} color={theme.success} />
                        <Text style={[styles.permissionText, { color: theme.text.secondary }]}>
                          {permission.charAt(0).toUpperCase() + permission.slice(1)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                
                {selectedFeature.dependencies && selectedFeature.dependencies.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalSectionTitle, { color: theme.text.primary }]}>
                      Dependencies:
                    </Text>
                    {selectedFeature.dependencies.map(dep => (
                      <View key={dep} style={styles.dependencyItem}>
                        <Ionicons 
                          name={features[dep] ? "checkmark-circle" : "close-circle"} 
                          size={16} 
                          color={features[dep] ? theme.success : theme.error} 
                        />
                        <Text style={[styles.dependencyItemText, { color: theme.text.secondary }]}>
                          {FEATURE_FLAGS[dep]?.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: theme.primary }]}
                    onPress={() => {
                      setShowInfoModal(false);
                      handleFeatureToggle(selectedFeature.id);
                    }}
                  >
                    <Text style={styles.modalButtonText}>
                      {features[selectedFeature.id] ? 'Disable' : 'Enable'} Feature
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 60,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  categoryCount: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  featuresContainer: {
    flex: 1,
    padding: 16,
  },
  featureItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  featureContent: {
    flex: 1,
    marginRight: 12,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  featureName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  featureBadges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  dependencies: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dependencyText: {
    fontSize: 12,
    marginLeft: 4,
  },
  featureToggle: {
    justifyContent: 'center',
  },
  upgradeButton: {
    padding: 8,
    borderRadius: 8,
  },
  bulkAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  bulkActionText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '70%',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  permissionText: {
    fontSize: 14,
    marginLeft: 8,
  },
  dependencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dependencyItemText: {
    fontSize: 14,
    marginLeft: 8,
  },
  modalActions: {
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FeaturesSettings;
