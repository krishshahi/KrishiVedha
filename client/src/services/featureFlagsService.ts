import AsyncStorage from '@react-native-async-storage/async-storage';

// Feature flag categories
export enum FeatureCategory {
  CORE = 'core',
  AI_ML = 'ai_ml',
  IOT = 'iot',
  SOCIAL = 'social',
  EXPERIMENTAL = 'experimental',
  BETA = 'beta',
  PREMIUM = 'premium',
  DEVELOPER = 'developer',
}

// Feature flag interface
export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  category: FeatureCategory;
  enabled: boolean;
  requiresRestart?: boolean;
  requiresPremium?: boolean;
  requiresPermission?: string[];
  dependencies?: string[];
  experimental?: boolean;
  beta?: boolean;
  deprecated?: boolean;
  minVersion?: string;
  maxVersion?: string;
  rolloutPercentage?: number;
}

// Feature flags configuration
export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  // Core Features
  offlineMode: {
    id: 'offlineMode',
    name: 'Offline Mode',
    description: 'Enable full offline functionality with local data storage',
    category: FeatureCategory.CORE,
    enabled: true,
    requiresRestart: false,
  },
  autoSync: {
    id: 'autoSync',
    name: 'Auto Sync',
    description: 'Automatically sync data when internet is available',
    category: FeatureCategory.CORE,
    enabled: true,
    dependencies: ['offlineMode'],
  },
  darkMode: {
    id: 'darkMode',
    name: 'Dark Mode',
    description: 'Enable dark theme support',
    category: FeatureCategory.CORE,
    enabled: true,
  },
  multiLanguage: {
    id: 'multiLanguage',
    name: 'Multi-Language Support',
    description: 'Enable multiple language options',
    category: FeatureCategory.CORE,
    enabled: true,
  },

  // AI/ML Features
  cropHealthAnalysis: {
    id: 'cropHealthAnalysis',
    name: 'AI Crop Health Analysis',
    description: 'Use AI to analyze crop health from images',
    category: FeatureCategory.AI_ML,
    enabled: true,
    requiresPermission: ['camera'],
  },
  diseaseDetection: {
    id: 'diseaseDetection',
    name: 'Disease Detection',
    description: 'AI-powered plant disease identification',
    category: FeatureCategory.AI_ML,
    enabled: true,
    dependencies: ['cropHealthAnalysis'],
    requiresPermission: ['camera'],
  },
  yieldPrediction: {
    id: 'yieldPrediction',
    name: 'Yield Prediction',
    description: 'ML-based crop yield forecasting',
    category: FeatureCategory.AI_ML,
    enabled: true,
  },
  soilAnalysis: {
    id: 'soilAnalysis',
    name: 'Soil Analysis',
    description: 'AI soil quality assessment from images',
    category: FeatureCategory.AI_ML,
    enabled: false,
    experimental: true,
    requiresPermission: ['camera'],
  },
  pestIdentification: {
    id: 'pestIdentification',
    name: 'Pest Identification',
    description: 'Identify pests using computer vision',
    category: FeatureCategory.AI_ML,
    enabled: false,
    beta: true,
    requiresPermission: ['camera'],
  },
  voiceCommands: {
    id: 'voiceCommands',
    name: 'Voice Commands',
    description: 'Control app using voice commands',
    category: FeatureCategory.AI_ML,
    enabled: false,
    experimental: true,
    requiresPermission: ['microphone'],
  },

  // IoT Features
  sensorIntegration: {
    id: 'sensorIntegration',
    name: 'IoT Sensor Integration',
    description: 'Connect and monitor IoT sensors',
    category: FeatureCategory.IOT,
    enabled: false,
    requiresPremium: true,
    requiresPermission: ['bluetooth'],
  },
  automatedIrrigation: {
    id: 'automatedIrrigation',
    name: 'Smart Irrigation',
    description: 'Automated irrigation control based on sensor data',
    category: FeatureCategory.IOT,
    enabled: false,
    dependencies: ['sensorIntegration'],
    requiresPremium: true,
  },
  droneMapping: {
    id: 'droneMapping',
    name: 'Drone Field Mapping',
    description: 'Integration with agricultural drones',
    category: FeatureCategory.IOT,
    enabled: false,
    experimental: true,
    requiresPremium: true,
  },
  weatherStation: {
    id: 'weatherStation',
    name: 'Weather Station',
    description: 'Connect to personal weather stations',
    category: FeatureCategory.IOT,
    enabled: false,
    beta: true,
  },

  // Social Features
  communityForum: {
    id: 'communityForum',
    name: 'Community Forum',
    description: 'Participate in farming community discussions',
    category: FeatureCategory.SOCIAL,
    enabled: true,
  },
  expertConsultation: {
    id: 'expertConsultation',
    name: 'Expert Consultation',
    description: 'Connect with agricultural experts',
    category: FeatureCategory.SOCIAL,
    enabled: true,
    requiresPremium: true,
  },
  farmerMarketplace: {
    id: 'farmerMarketplace',
    name: 'Farmer Marketplace',
    description: 'Buy and sell agricultural products',
    category: FeatureCategory.SOCIAL,
    enabled: true,
  },
  knowledgeSharing: {
    id: 'knowledgeSharing',
    name: 'Knowledge Sharing',
    description: 'Share farming tips and experiences',
    category: FeatureCategory.SOCIAL,
    enabled: true,
  },
  socialMediaIntegration: {
    id: 'socialMediaIntegration',
    name: 'Social Media Integration',
    description: 'Share achievements on social media',
    category: FeatureCategory.SOCIAL,
    enabled: false,
  },

  // Experimental Features
  arCropVisualization: {
    id: 'arCropVisualization',
    name: 'AR Crop Visualization',
    description: 'Visualize crop growth using augmented reality',
    category: FeatureCategory.EXPERIMENTAL,
    enabled: false,
    experimental: true,
    requiresPermission: ['camera'],
    requiresRestart: true,
  },
  blockchainTraceability: {
    id: 'blockchainTraceability',
    name: 'Blockchain Traceability',
    description: 'Track produce from farm to table using blockchain',
    category: FeatureCategory.EXPERIMENTAL,
    enabled: false,
    experimental: true,
    requiresPremium: true,
  },
  satelliteImagery: {
    id: 'satelliteImagery',
    name: 'Satellite Field Monitoring',
    description: 'Monitor fields using satellite imagery',
    category: FeatureCategory.EXPERIMENTAL,
    enabled: false,
    experimental: true,
    requiresPremium: true,
  },
  geneticCropOptimization: {
    id: 'geneticCropOptimization',
    name: 'Genetic Crop Optimization',
    description: 'AI-based crop variety recommendations',
    category: FeatureCategory.EXPERIMENTAL,
    enabled: false,
    experimental: true,
  },

  // Beta Features
  advancedAnalytics: {
    id: 'advancedAnalytics',
    name: 'Advanced Analytics Dashboard',
    description: 'Detailed farm performance analytics',
    category: FeatureCategory.BETA,
    enabled: false,
    beta: true,
  },
  multiFieldManagement: {
    id: 'multiFieldManagement',
    name: 'Multi-Field Management',
    description: 'Manage multiple fields simultaneously',
    category: FeatureCategory.BETA,
    enabled: false,
    beta: true,
  },
  cropRotationPlanner: {
    id: 'cropRotationPlanner',
    name: 'Crop Rotation Planner',
    description: 'AI-powered crop rotation suggestions',
    category: FeatureCategory.BETA,
    enabled: false,
    beta: true,
  },
  financialManagement: {
    id: 'financialManagement',
    name: 'Financial Management',
    description: 'Track farm expenses and revenues',
    category: FeatureCategory.BETA,
    enabled: false,
    beta: true,
  },

  // Premium Features
  unlimitedStorage: {
    id: 'unlimitedStorage',
    name: 'Unlimited Cloud Storage',
    description: 'Store unlimited photos and data',
    category: FeatureCategory.PREMIUM,
    enabled: false,
    requiresPremium: true,
  },
  prioritySupport: {
    id: 'prioritySupport',
    name: 'Priority Support',
    description: '24/7 priority customer support',
    category: FeatureCategory.PREMIUM,
    enabled: false,
    requiresPremium: true,
  },
  exportReports: {
    id: 'exportReports',
    name: 'Advanced Report Export',
    description: 'Export detailed reports in multiple formats',
    category: FeatureCategory.PREMIUM,
    enabled: false,
    requiresPremium: true,
  },
  apiAccess: {
    id: 'apiAccess',
    name: 'API Access',
    description: 'Programmatic access to your farm data',
    category: FeatureCategory.PREMIUM,
    enabled: false,
    requiresPremium: true,
  },

  // Developer Features
  debugMode: {
    id: 'debugMode',
    name: 'Debug Mode',
    description: 'Show debug information and logs',
    category: FeatureCategory.DEVELOPER,
    enabled: false,
    requiresRestart: true,
  },
  performanceMonitor: {
    id: 'performanceMonitor',
    name: 'Performance Monitor',
    description: 'Display app performance metrics',
    category: FeatureCategory.DEVELOPER,
    enabled: false,
  },
  networkInspector: {
    id: 'networkInspector',
    name: 'Network Inspector',
    description: 'Monitor network requests',
    category: FeatureCategory.DEVELOPER,
    enabled: false,
  },
  mockData: {
    id: 'mockData',
    name: 'Use Mock Data',
    description: 'Use simulated data for testing',
    category: FeatureCategory.DEVELOPER,
    enabled: false,
    requiresRestart: true,
  },
  crashReporting: {
    id: 'crashReporting',
    name: 'Crash Reporting',
    description: 'Send crash reports to improve app',
    category: FeatureCategory.DEVELOPER,
    enabled: true,
  },
};

// Feature flags service class
class FeatureFlagsService {
  private static instance: FeatureFlagsService;
  private features: Map<string, boolean> = new Map();
  private readonly STORAGE_KEY = '@krishivedha_feature_flags';
  private userTier: 'free' | 'premium' = 'free';
  private appVersion: string = '1.0.0';

  private constructor() {}

  static getInstance(): FeatureFlagsService {
    if (!FeatureFlagsService.instance) {
      FeatureFlagsService.instance = new FeatureFlagsService();
    }
    return FeatureFlagsService.instance;
  }

  // Initialize feature flags
  async initialize(userTier: 'free' | 'premium' = 'free', appVersion: string = '1.0.0'): Promise<void> {
    this.userTier = userTier;
    this.appVersion = appVersion;
    
    console.log('🚀 Initializing feature flags service...');
    
    try {
      // Load saved feature states
      const savedFeatures = await this.loadFeatureStates();
      
      // Initialize features with saved states or defaults
      Object.entries(FEATURE_FLAGS).forEach(([id, feature]) => {
        const isEnabled = savedFeatures[id] !== undefined 
          ? savedFeatures[id] 
          : this.shouldEnableByDefault(feature);
        
        this.features.set(id, isEnabled);
      });
      
      console.log('✅ Feature flags initialized successfully');
      console.log(`📊 ${this.getEnabledFeaturesCount()} features enabled`);
    } catch (error) {
      console.error('❌ Failed to initialize feature flags:', error);
      this.initializeDefaults();
    }
  }

  // Check if feature should be enabled by default
  private shouldEnableByDefault(feature: FeatureFlag): boolean {
    // Check if premium feature and user tier
    if (feature.requiresPremium && this.userTier !== 'premium') {
      return false;
    }
    
    // Check version compatibility
    if (feature.minVersion && this.compareVersions(this.appVersion, feature.minVersion) < 0) {
      return false;
    }
    
    if (feature.maxVersion && this.compareVersions(this.appVersion, feature.maxVersion) > 0) {
      return false;
    }
    
    // Check rollout percentage
    if (feature.rolloutPercentage !== undefined) {
      return Math.random() * 100 < feature.rolloutPercentage;
    }
    
    // Don't enable experimental or beta features by default
    if (feature.experimental || feature.beta) {
      return false;
    }
    
    return feature.enabled;
  }

  // Initialize with default values
  private initializeDefaults(): void {
    Object.entries(FEATURE_FLAGS).forEach(([id, feature]) => {
      this.features.set(id, this.shouldEnableByDefault(feature));
    });
  }

  // Load saved feature states
  private async loadFeatureStates(): Promise<Record<string, boolean>> {
    try {
      const saved = await AsyncStorage.getItem(this.STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Error loading feature states:', error);
      return {};
    }
  }

  // Save feature states
  private async saveFeatureStates(): Promise<void> {
    try {
      const states: Record<string, boolean> = {};
      this.features.forEach((enabled, id) => {
        states[id] = enabled;
      });
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(states));
    } catch (error) {
      console.error('Error saving feature states:', error);
    }
  }

  // Check if feature is enabled
  isEnabled(featureId: string): boolean {
    if (!this.features.has(featureId)) {
      console.warn(`Feature ${featureId} not found`);
      return false;
    }
    
    const feature = FEATURE_FLAGS[featureId];
    if (!feature) return false;
    
    // Check dependencies
    if (feature.dependencies) {
      for (const dep of feature.dependencies) {
        if (!this.isEnabled(dep)) {
          return false;
        }
      }
    }
    
    // Check premium requirement
    if (feature.requiresPremium && this.userTier !== 'premium') {
      return false;
    }
    
    return this.features.get(featureId) || false;
  }

  // Enable feature
  async enableFeature(featureId: string): Promise<boolean> {
    const feature = FEATURE_FLAGS[featureId];
    if (!feature) {
      console.error(`Feature ${featureId} not found`);
      return false;
    }
    
    // Check premium requirement
    if (feature.requiresPremium && this.userTier !== 'premium') {
      console.warn(`Feature ${featureId} requires premium subscription`);
      return false;
    }
    
    // Check dependencies
    if (feature.dependencies) {
      for (const dep of feature.dependencies) {
        if (!this.isEnabled(dep)) {
          console.warn(`Feature ${featureId} requires ${dep} to be enabled`);
          return false;
        }
      }
    }
    
    this.features.set(featureId, true);
    await this.saveFeatureStates();
    
    console.log(`✅ Feature ${featureId} enabled`);
    return true;
  }

  // Disable feature
  async disableFeature(featureId: string): Promise<boolean> {
    const feature = FEATURE_FLAGS[featureId];
    if (!feature) {
      console.error(`Feature ${featureId} not found`);
      return false;
    }
    
    // Check if other features depend on this
    const dependents = this.getDependentFeatures(featureId);
    if (dependents.length > 0) {
      console.warn(`Cannot disable ${featureId}, required by: ${dependents.join(', ')}`);
      return false;
    }
    
    this.features.set(featureId, false);
    await this.saveFeatureStates();
    
    console.log(`❌ Feature ${featureId} disabled`);
    return true;
  }

  // Toggle feature
  async toggleFeature(featureId: string): Promise<boolean> {
    if (this.isEnabled(featureId)) {
      return await this.disableFeature(featureId);
    } else {
      return await this.enableFeature(featureId);
    }
  }

  // Get dependent features
  private getDependentFeatures(featureId: string): string[] {
    const dependents: string[] = [];
    
    Object.entries(FEATURE_FLAGS).forEach(([id, feature]) => {
      if (feature.dependencies?.includes(featureId) && this.isEnabled(id)) {
        dependents.push(id);
      }
    });
    
    return dependents;
  }

  // Get all features by category
  getFeaturesByCategory(category: FeatureCategory): FeatureFlag[] {
    return Object.values(FEATURE_FLAGS).filter(f => f.category === category);
  }

  // Get enabled features count
  getEnabledFeaturesCount(): number {
    let count = 0;
    this.features.forEach((enabled) => {
      if (enabled) count++;
    });
    return count;
  }

  // Get feature statistics
  getFeatureStatistics(): {
    total: number;
    enabled: number;
    disabled: number;
    experimental: number;
    beta: number;
    premium: number;
  } {
    const stats = {
      total: Object.keys(FEATURE_FLAGS).length,
      enabled: 0,
      disabled: 0,
      experimental: 0,
      beta: 0,
      premium: 0,
    };
    
    Object.entries(FEATURE_FLAGS).forEach(([id, feature]) => {
      if (this.isEnabled(id)) {
        stats.enabled++;
      } else {
        stats.disabled++;
      }
      
      if (feature.experimental) stats.experimental++;
      if (feature.beta) stats.beta++;
      if (feature.requiresPremium) stats.premium++;
    });
    
    return stats;
  }

  // Reset all features to defaults
  async resetToDefaults(): Promise<void> {
    this.initializeDefaults();
    await this.saveFeatureStates();
    console.log('🔄 Features reset to defaults');
  }

  // Enable all experimental features
  async enableExperimentalFeatures(): Promise<void> {
    for (const [id, feature] of Object.entries(FEATURE_FLAGS)) {
      if (feature.experimental) {
        await this.enableFeature(id);
      }
    }
  }

  // Enable all beta features
  async enableBetaFeatures(): Promise<void> {
    for (const [id, feature] of Object.entries(FEATURE_FLAGS)) {
      if (feature.beta) {
        await this.enableFeature(id);
      }
    }
  }

  // Export feature configuration
  exportConfiguration(): string {
    const config: Record<string, boolean> = {};
    this.features.forEach((enabled, id) => {
      config[id] = enabled;
    });
    return JSON.stringify(config, null, 2);
  }

  // Import feature configuration
  async importConfiguration(configJson: string): Promise<void> {
    try {
      const config = JSON.parse(configJson);
      Object.entries(config).forEach(([id, enabled]) => {
        if (FEATURE_FLAGS[id]) {
          this.features.set(id, enabled as boolean);
        }
      });
      await this.saveFeatureStates();
      console.log('✅ Feature configuration imported');
    } catch (error) {
      console.error('Error importing feature configuration:', error);
      throw error;
    }
  }

  // Compare version strings
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      
      if (part1 < part2) return -1;
      if (part1 > part2) return 1;
    }
    
    return 0;
  }

  // Update user tier
  updateUserTier(tier: 'free' | 'premium'): void {
    this.userTier = tier;
    // Re-evaluate premium features
    Object.entries(FEATURE_FLAGS).forEach(([id, feature]) => {
      if (feature.requiresPremium) {
        if (tier === 'premium') {
          // Don't auto-enable, let user choose
          console.log(`Premium feature ${id} now available`);
        } else {
          // Disable premium features for free tier
          this.features.set(id, false);
        }
      }
    });
  }
}

// Export singleton instance
export const featureFlagsService = FeatureFlagsService.getInstance();
export default featureFlagsService;
