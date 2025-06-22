import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { COLORS } from '../constants/colors';
import { SPACING, FONTS } from '../constants/theme';
import apiService from '../services/apiService';
import { profileScreenStyles as styles } from '../styles/ProfileScreen.styles';
import { logoutUser } from '../store/slices/authSlice';
import { fetchDashboardData } from '../store/slices/dashboardSlice';

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

const ProfileScreen = () => {
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector((state) => state.auth);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>User not found. Please log in.</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => dispatch(logoutUser())}
        >
          <Text style={styles.retryButtonText}>Go to Login</Text>
        </TouchableOpacity>
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
          <Text style={styles.profileName}>{user.name}</Text>
          <Text style={styles.profileType}>{user.role}</Text>
          <TouchableOpacity style={styles.editProfileButton}>
            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.farmSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Farms</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                // Navigate to an "Add Farm" screen
              }}
            >
              <Text style={styles.addButtonText}>+ Add Farm</Text>
            </TouchableOpacity>
          </View>

          {user.farms && user.farms.length > 0 ? (
            user.farms.map((farm) => (
              <FarmCard
                key={farm.id}
                name={farm.name}
                location={farm.location.address}
                crops={farm.crops.map(c => c.name)}
                size={`${farm.size.value} ${farm.size.unit}`}
                onPress={() => {
                  // Navigate to farm details
                }}
              />
            ))
          ) : (
            <View style={styles.emptyFarmsContainer}>
              <Text style={styles.emptyFarmsText}>No farms found</Text>
              <Text style={styles.emptyFarmsSubtext}>
                Add your first farm to get started
              </Text>
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
              value={`${user.location?.district}, ${user.location?.country}`}
              onPress={() => {}}
            />
            <SettingItem
              title="Language"
              icon="🌐"
              value={user.preferences.language}
              onPress={() => {}}
            />
            <SettingItem
              title="Measurement Units"
              icon="📏"
              value={user.preferences.measurementUnit}
              onPress={() => {}}
            />
          </View>

          <View style={styles.settingsGroup}>
            <Text style={styles.settingsGroupTitle}>Notifications</Text>
            <SettingItem
              title="Weather Alerts"
              icon="⛈️"
              isSwitch
              isSwitchOn={user.preferences.weatherAlerts}
              onToggle={() => {}}
            />
            <SettingItem
              title="Crop Reminders"
              icon="🌱"
              isSwitch
              isSwitchOn={user.preferences.cropReminders}
              onToggle={() => {}}
            />
            <SettingItem
              title="Community Updates"
              icon="👥"
              isSwitch
              isSwitchOn={user.preferences.communityUpdates}
              onToggle={() => {}}
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
            <SettingItem title="App Version" icon="📱" value="1.0.0" />
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => {
              Alert.alert(
                'Sign Out',
                'Are you sure you want to sign out?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: () => dispatch(logoutUser()),
                  },
                ]
              );
            }}
          >
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};


export default ProfileScreen;

