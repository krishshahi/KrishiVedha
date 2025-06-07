import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, TextInput, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants/colors';
import { SPACING, FONTS } from '../constants/theme';
import { apiService } from '../services/apiService';
import styles from '../styles/ProfileScreen.styles';

interface SettingItemProps {
  title: string;
  icon: string;
  value?: string;
  isSwitch?: boolean;
  isSwitchOn?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

const SettingItem: React.FC<SettingItemProps> = ({ 
  title, 
  icon, 
  value, 
  isSwitch = false, 
  isSwitchOn = false, 
  onPress, 
  onToggle 
}) => {
  return (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={isSwitch}
    >
      <Text style={styles.settingIcon}>{icon}</Text>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {value && <Text style={styles.settingValue}>{value}</Text>}
      </View>
      {isSwitch ? (
        <Switch
          value={isSwitchOn}
          onValueChange={onToggle}
          trackColor={{ false: COLORS.disabled, true: COLORS.primary + '80' }}
          thumbColor={isSwitchOn ? COLORS.primary : COLORS.backgroundDark}
        />
      ) : (
        <Text style={styles.chevronIcon}>›</Text>
      )}
    </TouchableOpacity>
  );
};

interface FarmCardProps {
  name: string;
  location: string;
  crops: string[];
  size: string;
  onPress: () => void;
}

const FarmCard: React.FC<FarmCardProps> = ({ name, location, crops, size, onPress }) => {
  return (
    <TouchableOpacity style={styles.farmCard} onPress={onPress}>
      <View style={styles.farmIconContainer}>
        <Text style={styles.farmIcon}>🌾</Text>
      </View>
      <View style={styles.farmInfo}>
        <Text style={styles.farmName}>{name}</Text>
        <Text style={styles.farmLocation}>{location}</Text>
        <Text style={styles.farmCrops}>Crops: {crops.join(', ')}</Text>
        <Text style={styles.farmSize}>Size: {size}</Text>
      </View>
    </TouchableOpacity>
  );
};

// Types for backend data
interface UserProfile {
  id: string;
  name: string;
  profileType: string;
  location: string;
  language: string;
  profileImage?: string;
}

interface Farm {
  id: string;
  name: string;
  location: string;
  crops: string[];
  size: string;
}

interface UserSettings {
  weatherAlerts: boolean;
  cropReminders: boolean;
  communityUpdates: boolean;
  units: string;
}

// API functions using the backend service
const fetchUserProfile = async (): Promise<UserProfile> => {
  try {
    const userData = await apiService.getCurrentUser();
    return {
      id: userData.id,
      name: userData.name,
      profileType: userData.profile_type || 'Farmer',
      location: userData.location || 'Not set',
      language: userData.language || 'English'
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    // Return default profile on error
    return {
      id: '1',
      name: 'John Doe',
      profileType: 'Farmer',
      location: 'Unknown Location',
      language: 'English'
    };
  }
};

const fetchUserFarms = async (): Promise<Farm[]> => {
  try {
    const farmsData = await apiService.getFarms();
    return farmsData.map(farm => ({
      id: farm.id,
      name: farm.name,
      location: farm.location,
      crops: farm.crops || [],
      size: farm.size || 'Unknown size'
    }));
  } catch (error) {
    console.error('Error fetching user farms:', error);
    // Return empty array on error
    return [];
  }
};

const fetchUserSettings = async (): Promise<UserSettings> => {
  try {
    // Since we don't have a specific settings endpoint yet,
    // we'll use the user data and provide defaults
    const userData = await apiService.getCurrentUser();
    return {
      weatherAlerts: userData.weather_alerts ?? true,
      cropReminders: userData.crop_reminders ?? true,
      communityUpdates: userData.community_updates ?? false,
      units: userData.units || 'Metric'
    };
  } catch (error) {
    console.error('Error fetching user settings:', error);
    // Return default settings on error
    return {
      weatherAlerts: true,
      cropReminders: true,
      communityUpdates: false,
      units: 'Metric'
    };
  }
};

const ProfileScreen = () => {
  // User profile state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Settings state
  const [weatherAlerts, setWeatherAlerts] = useState(true);
  const [cropReminders, setCropReminders] = useState(true);
  const [communityUpdates, setCommunityUpdates] = useState(false);
  const [units, setUnits] = useState('Metric');
  
  // Fetch data from backend on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all data concurrently
        const [profileData, farmsData, settingsData] = await Promise.all([
          fetchUserProfile(),
          fetchUserFarms(),
          fetchUserSettings()
        ]);
        
        setUserProfile(profileData);
        setFarms(farmsData);
        setWeatherAlerts(settingsData.weatherAlerts);
        setCropReminders(settingsData.cropReminders);
        setCommunityUpdates(settingsData.communityUpdates);
        setUnits(settingsData.units);
        
      } catch (err) {
        setError('Failed to load profile data. Please try again.');
        console.error('Error loading user data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, []);
  
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              // Trigger data reload by calling loadUserData again
              const loadUserData = async () => {
                try {
                  setLoading(true);
                  setError(null);
                  
                  const [profileData, farmsData, settingsData] = await Promise.all([
                    fetchUserProfile(),
                    fetchUserFarms(),
                    fetchUserSettings()
                  ]);
                  
                  setUserProfile(profileData);
                  setFarms(farmsData);
                  setWeatherAlerts(settingsData.weatherAlerts);
                  setCropReminders(settingsData.cropReminders);
                  setCommunityUpdates(settingsData.communityUpdates);
                  setUnits(settingsData.units);
                  
                } catch (err) {
                  setError('Failed to load profile data. Please try again.');
                  console.error('Error loading user data:', err);
                } finally {
                  setLoading(false);
                }
              };
              loadUserData();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Text style={styles.profileImagePlaceholder}>👨‍🌾</Text>
          </View>
          <Text style={styles.profileName}>{userProfile?.name || 'Unknown User'}</Text>
          <Text style={styles.profileType}>{userProfile?.profileType || 'User'}</Text>
          <TouchableOpacity style={styles.editProfileButton}>
            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.farmSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Farms</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={async () => {
                try {
                  // Create a new farm (example implementation)
                  const newFarm = await apiService.createFarm({
                    name: 'New Farm',
                    location: 'Enter location',
                    crops: [],
                    size: '0 hectares'
                  });
                  
                  // Refresh farms list
                  const updatedFarms = await fetchUserFarms();
                  setFarms(updatedFarms);
                  
                  console.log('New farm created:', newFarm);
                } catch (error) {
                  console.error('Error creating farm:', error);
                }
              }}
            >
              <Text style={styles.addButtonText}>+ Add Farm</Text>
            </TouchableOpacity>
          </View>
          
          {farms.length > 0 ? (
            farms.map((farm) => (
              <FarmCard
                key={farm.id}
                name={farm.name}
                location={farm.location}
                crops={farm.crops}
                size={farm.size}
                onPress={() => {
                  // Navigate to farm details or handle farm selection
                  console.log('Selected farm:', farm.name);
                }}
              />
            ))
          ) : (
            <View style={styles.emptyFarmsContainer}>
              <Text style={styles.emptyFarmsText}>No farms found</Text>
              <Text style={styles.emptyFarmsSubtext}>Add your first farm to get started</Text>
            </View>
          )}
        </View>
        
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.settingsGroup}>
            <Text style={styles.settingsGroupTitle}>Account</Text>
            <SettingItem
              title="Personal Information"
              icon="👤"
              onPress={() => {}}
            />
            <SettingItem
              title="Location"
              icon="📍"
              value={userProfile?.location || 'Not set'}
              onPress={() => {}}
            />
            <SettingItem
              title="Language"
              icon="🌐"
              value={userProfile?.language || 'English'}
              onPress={() => {}}
            />
            <SettingItem
              title="Measurement Units"
              icon="📏"
              value={units}
              onPress={() => {}}
            />
          </View>
          
          <View style={styles.settingsGroup}>
            <Text style={styles.settingsGroupTitle}>Notifications</Text>
            <SettingItem
              title="Weather Alerts"
              icon="⛈️"
              isSwitch
              isSwitchOn={weatherAlerts}
              onToggle={setWeatherAlerts}
            />
            <SettingItem
              title="Crop Reminders"
              icon="🌱"
              isSwitch
              isSwitchOn={cropReminders}
              onToggle={setCropReminders}
            />
            <SettingItem
              title="Community Updates"
              icon="👥"
              isSwitch
              isSwitchOn={communityUpdates}
              onToggle={setCommunityUpdates}
            />
          </View>
          
          <View style={styles.settingsGroup}>
            <Text style={styles.settingsGroupTitle}>About</Text>
            <SettingItem
              title="Help & Support"
              icon="❓"
              onPress={() => {}}
            />
            <SettingItem
              title="Terms & Privacy"
              icon="📜"
              onPress={() => {}}
            />
            <SettingItem
              title="App Version"
              icon="📱"
              value="1.0.0"
            />
          </View>
          
          <TouchableOpacity style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};


export default ProfileScreen;

