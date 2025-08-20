import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Switch, 
  ActivityIndicator, 
  Alert, 
  Modal,
  TextInput,
  Image,
  ActionSheetIOS,
  Platform,
  RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { COLORS } from '../constants/theme';
import apiService, { ApiFarm } from '../services/apiService';
import authService from '../services/authService';
import { profileScreenStyles as styles } from '../styles/ProfileScreen.styles';
import { logoutUser, syncUserData, setNotificationPreference, updateUserProfile, updateUser } from '../store/slices/authSlice';

type ProfileScreenNavigationProp = StackNavigationProp<any, 'ProfileMain'>;

interface SettingItemProps {
  title: string;
  icon: string;
  value?: string;
  isSwitch?: boolean;
  isSwitchOn?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  showChevron?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({ 
  title, 
  icon, 
  value, 
  isSwitch = false, 
  isSwitchOn = false, 
  onPress, 
  onToggle,
  showChevron = true 
}) => {
  return (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={isSwitch && !onToggle}
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
          trackColor={{ false: COLORS.backgroundDark, true: COLORS.primary + '40' }}
          thumbColor={isSwitchOn ? COLORS.primary : COLORS.text.primaryLight}
        />
      ) : showChevron ? (
        <Text style={styles.chevronIcon}>›</Text>
      ) : null}
    </TouchableOpacity>
  );
};

interface QuickActionProps {
  icon: string;
  label: string;
  onPress: () => void;
}

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  user: any;
  onSave: (data: any) => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, label, onPress }) => {
  return (
    <TouchableOpacity style={styles.quickActionButton} onPress={onPress}>
      <Text style={styles.settingIcon}>{icon}</Text>
      <Text style={styles.quickActionText}>{label}</Text>
    </TouchableOpacity>
  );
};

const EditProfileModal: React.FC<EditProfileModalProps> = ({ visible, onClose, user, onSave }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      onClose();
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <Text style={[styles.modalSaveButton, saving && styles.modalSaveButtonDisabled]}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Enter your full name"
              placeholderTextColor={COLORS.text.primaryLight}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={formData.email}
              editable={false}
              placeholder="Email address"
              placeholderTextColor={COLORS.text.primaryLight}
            />
            <Text style={styles.inputHelper}>Email cannot be changed</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
              placeholder="Enter your phone number"
              placeholderTextColor={COLORS.text.primaryLight}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={formData.location}
              onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
              placeholder="Enter your location"
              placeholderTextColor={COLORS.text.primaryLight}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};


const ProfileScreen = () => {
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector((state) => state.auth);
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [farms, setFarms] = useState<ApiFarm[]>([]);
  const [farmsLoading, setFarmsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(user?.profilePicture || null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [userStats, setUserStats] = useState({ 
    farmCount: 0, 
    totalArea: 0, 
    cropTypes: [] as string[] 
  });

  // Sync authService with Redux state
  const syncAuthService = useCallback(async () => {
    if (user && user.id && !authService.isUserAuthenticated()) {
      try {
        console.log('[AUTH] 🔄 Syncing auth service with Redux user data...');
        // Set the auth service state from Redux
        authService.currentUser = user;
        authService.isAuthenticated = true;
        
        // Try to restore tokens from storage
        const storedTokens = await authService.getStoredTokens();
        if (storedTokens) {
          authService.authToken = storedTokens.authToken;
          authService.refreshToken = storedTokens.refreshToken;
          console.log('[AUTH] ✅ Auth service synchronized with stored tokens');
        } else {
          console.log('[AUTH] ⚠️ No stored tokens found, but user is logged in via Redux');
        }
      } catch (error) {
        console.warn('[AUTH] Failed to sync auth service:', error);
      }
    }
  }, [user]);

  const fetchUserData = useCallback(async (isRefresh = false) => {
    if (!user?.id) {
      console.log('[PROFILE] No user ID available, skipping data fetch');
      return;
    }
    
    try {
      if (!isRefresh) setFarmsLoading(true);
      console.log('[PROFILE] 🚀 Fetching user data for userId:', user.id);
      console.log('[PROFILE] 🚀 Current user object:', { id: user.id, name: user.name, email: user.email });
      
      // Ensure auth service is synced
      await syncAuthService();
      
      // Check if backend is available
      const isHealthy = await apiService.healthCheck();
      if (!isHealthy) {
        console.warn('Backend server not available, using empty placeholder data');
        // Use empty placeholder data when backend is unavailable
        // This prevents showing crops from "another user" when offline
        const placeholderStats = { farmCount: 0, totalArea: 0, cropTypes: [] };
        setUserStats(placeholderStats);
        setFarms([]);
        return;
      }
      
      // Fetch farms and stats in parallel
      const [userFarms, stats] = await Promise.all([
        apiService.getFarmsByUserId(user.id),
        apiService.getUserStats(user.id)
      ]);
      
      setFarms(userFarms);
      setUserStats(stats);
      console.log('[PROFILE] ✅ User data fetched successfully');
    } catch (error: any) {
      console.error('Failed to fetch user data:', error);
      
      // Use fallback data for better UX
      const fallbackStats = { 
        farmCount: 0, 
        totalArea: 0, 
        cropTypes: [] 
      };
      setUserStats(fallbackStats);
      setFarms([]);
      
      if (!error.code?.includes('ERR_NETWORK') && !isRefresh) {
        Alert.alert('Notice', 'Unable to load latest data. Showing cached information.');
      }
    } finally {
      if (!isRefresh) setFarmsLoading(false);
    }
  }, [user?.id, syncAuthService]);


  const handleEditProfile = useCallback(async (formData: any) => {
    try {
      await dispatch(updateUserProfile(formData)).unwrap();
      await dispatch(syncUserData());
    } catch (error) {
      throw error;
    }
  }, [dispatch]);

  const handleQuickAction = useCallback((action: string) => {
    switch (action) {
      case 'addFarm':
        Alert.alert('Add Farm', 'Farm management feature will be available soon!');
        break;
      case 'weather':
        navigation.navigate('Weather');
        break;
      case 'community':
        navigation.navigate('Community');
        break;
      default:
        break;
    }
  }, [navigation]);

  const handleNotificationToggle = useCallback(async (key: string, value: boolean) => {
    try {
      console.log(`[NOTIFICATIONS] 🔔 Updating ${key} to ${value}`);
      
      // Update local Redux state immediately for instant UI feedback
      dispatch(setNotificationPreference({ key, value }));
      
      // Provide user feedback based on the change
      const notificationNames: { [key: string]: string } = {
        weatherAlerts: 'Weather Alerts',
        cropReminders: 'Crop Reminders',
        communityUpdates: 'Community Updates',
        notificationsEnabled: 'All Notifications',
      };
      
      const notificationName = notificationNames[key] || key.charAt(0).toUpperCase() + key.slice(1);
      const statusText = value ? 'enabled' : 'disabled';
      
      console.log(`[NOTIFICATIONS] ✅ Local preference updated: ${notificationName} ${statusText}`);
      
      // Optional: Try to sync with backend if available (don't block user experience)
      if (user?.id) {
        // Run backend sync in background without blocking UI
        setTimeout(async () => {
          try {
            const isHealthy = await apiService.healthCheck();
            if (isHealthy) {
              console.log(`[NOTIFICATIONS] 🔄 Background sync: ${key} preference to backend...`);
              
              // Get the current user preferences (might have changed since the toggle)
              const currentUser = await AsyncStorage.getItem('userData');
              if (currentUser) {
                const userData = JSON.parse(currentUser);
                
                // Update profile with current preferences (local is source of truth)
                await dispatch(updateUserProfile({ preferences: userData.preferences })).unwrap();
                console.log(`[NOTIFICATIONS] ✅ Background sync completed for ${key}`);
              }
            }
          } catch (syncError) {
            console.warn(`[NOTIFICATIONS] ⚠️ Background sync failed for ${key}:`, syncError);
            // Silent failure - user already has local changes saved
          }
        }, 100); // Small delay to not block UI
      }
      
      // Subtle success feedback - only for significant changes
      if (key === 'notificationsEnabled') {
        Alert.alert(
          value ? '🔔 Notifications Enabled' : '🔕 Notifications Disabled',
          value 
            ? 'You will receive notifications based on your preferences.'
            : 'All notifications have been disabled.',
          [{ text: 'OK', style: 'default' }],
          { cancelable: true }
        );
      } else {
        // For individual settings, just show a brief toast-like feedback
        console.log(`[NOTIFICATIONS] ℹ️ ${notificationName} ${statusText}`);
      }
      
    } catch (error) {
      console.error(`[NOTIFICATIONS] ❌ Failed to update ${key} preference:`, error);
      
      // Revert the change if there was an error
      dispatch(setNotificationPreference({ key, value: !value }));
      
      Alert.alert(
        'Error',
        `Failed to ${value ? 'enable' : 'disable'} ${notificationNames[key] || key}. Please try again.`,
        [{ text: 'OK', style: 'default' }]
      );
    }
  }, [dispatch, user]);

  // Profile picture handling
  const requestPermissions = useCallback(async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Please allow camera and photo library access to upload profile pictures.'
      );
      return false;
    }
    return true;
  }, []);

  const compressImage = useCallback(async (uri: string) => {
    try {
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 400, height: 400 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipulatedImage.uri;
    } catch (error) {
      console.error('Image compression error:', error);
      return uri; // Return original if compression fails
    }
  }, []);

  const uploadProfileImage = useCallback(async (imageUri: string) => {
    try {
      setUploadingImage(true);
      
      // Create FormData for image upload with proper React Native format
      const formData = new FormData();
      
      // For React Native, we need to properly format the file object
      const filename = imageUri.split('/').pop() || 'profile.jpg';
      const match = /\.([\w]+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('image', {
        uri: imageUri,
        name: filename,
        type: type,
      } as any);
      
      console.log('📤 Uploading image with FormData:', {
        uri: imageUri,
        name: filename,
        type: type
      });
      
      try {
        // Upload image via API service
        const response = await apiService.uploadImage(formData);
        
        console.log('📸 Upload response received:', JSON.stringify(response, null, 2));
        
        if (response.success) {
          let imageUrl = response.data.url;
          console.log('📸 Original image URL from server:', imageUrl);
          
          // Convert relative URL to full URL if needed
          if (imageUrl && imageUrl.startsWith('/uploads/')) {
            const baseUrl = apiService.baseURL; // Get base URL from apiService
            imageUrl = `${baseUrl}${imageUrl}`;
            console.log('📸 Constructed full image URL:', imageUrl);
          }
          
          console.log('📸 Final image URL to save:', imageUrl);
          
          // Update local state immediately for instant feedback
          setProfileImageUri(imageUrl);
          console.log('📸 Local state updated with image URL');
          
          // Update user profile in Redux store
          try {
            await dispatch(updateUserProfile({ profilePicture: imageUrl })).unwrap();
            console.log('📸 Redux store updated successfully');
            Alert.alert('Success', 'Profile picture updated successfully!');
          } catch (storeError) {
            console.warn('📸 Failed to update Redux store, but image uploaded:', storeError);
            // Keep local image even if store update fails
            Alert.alert('Success', 'Profile picture updated successfully!');
          }
        } else {
          throw new Error(response.message || 'Upload failed');
        }
      } catch (uploadError: any) {
        console.warn('Upload to server failed, using local image temporarily:', uploadError.message);
        
        // For demo purposes, use the local image URI directly
        // In production, you'd want to queue this for retry when network is available
        setProfileImageUri(imageUri);
        
        Alert.alert(
          'Image Updated Locally',
          'Your profile picture has been updated locally. It will be uploaded when network connection is restored.'
        );
      }
    } catch (error: any) {
      console.error('Profile image processing error:', error);
      Alert.alert(
        'Image Processing Failed',
        'Failed to process the image. Please try again with a different image.'
      );
    } finally {
      setUploadingImage(false);
    }
  }, [dispatch]);

  const showImagePickerOptions = useCallback(() => {
    const options = [
      { text: 'Take Photo', onPress: () => openCamera() },
      { text: 'Choose from Library', onPress: () => openImageLibrary() },
      { text: 'Cancel', style: 'cancel' as const }
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: options.map(opt => opt.text),
          cancelButtonIndex: 2,
          title: 'Update Profile Picture'
        },
        (buttonIndex) => {
          if (buttonIndex < 2) {
            options[buttonIndex].onPress();
          }
        }
      );
    } else {
      Alert.alert(
        'Update Profile Picture',
        'Choose an option',
        options
      );
    }
  }, []);

  const openCamera = useCallback(async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const compressedUri = await compressImage(result.assets[0].uri);
        await uploadProfileImage(compressedUri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  }, [requestPermissions, compressImage, uploadProfileImage]);

  const openImageLibrary = useCallback(async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const compressedUri = await compressImage(result.assets[0].uri);
        await uploadProfileImage(compressedUri);
      }
    } catch (error) {
      console.error('Image library error:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  }, [requestPermissions, compressImage, uploadProfileImage]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Only fetch farms and stats, don't sync user data to avoid overwriting
      await fetchUserData(true);
      
      // If you want to refresh user profile data, do it more conservatively
      if (user?.id) {
        try {
          // Only fetch the latest user data if backend is available
          const isHealthy = await apiService.healthCheck();
          if (isHealthy) {
            console.log('[REFRESH] 🔄 Refreshing user profile data...');
            const latestUserData = await apiService.getUserById(user.id);
            
            // Only update specific fields that might have changed, preserve others
            const updatedUser = {
              ...user, // Start with current user data
              name: latestUserData.name || user.name,
              email: latestUserData.email || user.email,
              phone: latestUserData.phone || user.phone,
              profilePicture: latestUserData.profilePicture || user.profilePicture,
              // Preserve location format from current user
              location: latestUserData.location ? (
                typeof user.location === 'string' ? latestUserData.location : {
                  ...user.location,
                  ...(typeof latestUserData.location === 'string' ? {
                    district: latestUserData.location.split(',')[0]?.trim() || user.location.district,
                    province: latestUserData.location.split(',')[1]?.trim() || user.location.province,
                    country: latestUserData.location.split(',')[2]?.trim() || user.location.country,
                  } : latestUserData.location)
                }
              ) : user.location,
              // Preserve all other fields like preferences, farms, etc.
            };
            
            // Update Redux state with preserved data
            dispatch(updateUser(updatedUser));
            
            // Update AsyncStorage
            await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
            
            console.log('[REFRESH] ✅ User profile data refreshed successfully');
          }
        } catch (error) {
          console.warn('[REFRESH] ⚠️ Failed to refresh user profile data:', error);
          // Continue silently - this shouldn't break the refresh
        }
      }
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchUserData, dispatch, user]);

  // Load user data when screen focuses
  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [fetchUserData])
  );
  
  // Update profile image when user data changes
  useEffect(() => {
    console.log('📸 User profile picture changed:', user?.profilePicture);
    console.log('📸 Current profileImageUri:', profileImageUri);
    if (user?.profilePicture && user.profilePicture !== profileImageUri) {
      console.log('📸 Updating profile image from user data:', user.profilePicture);
      setProfileImageUri(user.profilePicture);
    }
  }, [user?.profilePicture]);
  
  // Debug logging for profileImageUri changes
  useEffect(() => {
    console.log('📸 profileImageUri state changed to:', profileImageUri);
  }, [profileImageUri]);

  // Initialize and sync auth service when component mounts
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('[AUTH] 🚀 Initializing auth service on profile screen...');
        await syncAuthService();
        
        // Initialize auth service if not already done
        if (!authService.isAuthenticated && user) {
          await authService.initialize();
        }
      } catch (error) {
        console.warn('[AUTH] Failed to initialize auth service:', error);
      }
    };

    initializeAuth();
  }, []); // Run once on mount


  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>User not found</Text>
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
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => setShowEditModal(true)}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Main Profile Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          
          {/* Profile Picture */}
          <View style={styles.profileImageSection}>
            <TouchableOpacity
              style={styles.profileImageContainer}
              onPress={showImagePickerOptions}
              disabled={uploadingImage}
            >
              {profileImageUri ? (
                <Image 
                  source={{ uri: profileImageUri }} 
                  style={styles.profileImage}
                  onError={() => setProfileImageUri(null)}
                />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Text style={styles.profileImagePlaceholderText}>👤</Text>
                </View>
              )}
              
              {uploadingImage && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color={COLORS.text.primaryWhite} />
                </View>
              )}
              
              <View style={styles.cameraIcon}>
                <Text style={styles.cameraIconText}>📷</Text>
              </View>
            </TouchableOpacity>
            
            <Text style={styles.profileImageHint}>Tap to change photo</Text>
          </View>
          
          {/* Additional Profile Info */}
          <View style={styles.profileDetailsContainer}>
            <View style={styles.profileDetailRow}>
              <Text style={styles.profileDetailLabel}>Name:</Text>
              <View style={styles.profileDetailValueContainer}>
                <Text style={styles.profileDetailValue}>{user?.name || 'Not set'}</Text>
                {user?.isVerified && (
                  <View style={styles.verificationBadge}>
                    <Text style={styles.verificationText}>✓</Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.profileDetailRow}>
              <Text style={styles.profileDetailLabel}>Email:</Text>
              <Text style={styles.profileDetailValue}>{user?.email || 'Not set'}</Text>
            </View>
            
            {user?.phone && (
              <View style={styles.profileDetailRow}>
                <Text style={styles.profileDetailLabel}>Phone:</Text>
                <Text style={styles.profileDetailValue}>{user.phone}</Text>
              </View>
            )}
            
            {user?.location && (
              <View style={styles.profileDetailRow}>
                <Text style={styles.profileDetailLabel}>Location:</Text>
                <Text style={styles.profileDetailValue}>
                  📍 {typeof user.location === 'string' 
                    ? user.location 
                    : user.location.district 
                      ? `${user.location.district}${user.location.province ? `, ${user.location.province}` : ''}${user.location.country ? `, ${user.location.country}` : ''}` 
                      : 'Location not specified'
                  }
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <QuickAction 
              icon="🚜" 
              label="Add Farm" 
              onPress={() => handleQuickAction('addFarm')} 
            />
            <QuickAction 
              icon="🌦️" 
              label="Weather" 
              onPress={() => handleQuickAction('weather')} 
            />
            <QuickAction 
              icon="👥" 
              label="Community" 
              onPress={() => handleQuickAction('community')} 
            />
          </ScrollView>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userStats.farmCount}</Text>
            <Text style={styles.statLabel}>Farms</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userStats.cropTypes.length}</Text>
            <Text style={styles.statLabel}>Crop Types</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userStats.totalArea.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Total Area (ha)</Text>
          </View>
        </View>


        {/* My Farms Section - Only show if farms exist or loading */}
        {(farms.length > 0 || farmsLoading) && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Farms</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleQuickAction('addFarm')}
              >
                <Text style={styles.addButtonText}>+ Add</Text>
              </TouchableOpacity>
            </View>

            {farmsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading farms...</Text>
              </View>
            ) : farms.length > 0 ? (
              farms.slice(0, 3).map((farm) => (
                <TouchableOpacity
                  key={farm.id}
                  style={styles.farmCard}
                  onPress={() => Alert.alert('Farm Details', `${farm.name}\nLocation: ${farm.location}\nCrops: ${farm.crops.join(', ')}\nSize: ${farm.area} hectares`)}
                >
                  <View style={styles.farmIconContainer}>
                    <Text style={styles.farmIcon}>🌾</Text>
                  </View>
                  <View style={styles.farmInfo}>
                    <Text style={styles.farmName}>{farm.name}</Text>
                    <Text style={styles.farmLocation}>{farm.location}</Text>
                    <Text style={styles.farmCrops}>{farm.crops.join(', ')}</Text>
                    <Text style={styles.farmSize}>{farm.area} hectares</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : null}
            
            {farms.length > 3 && (
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>View All Farms ({farms.length})</Text>
              </TouchableOpacity>
            )}
          </View>
        )}


        {/* Settings */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <SettingItem
            title="Weather Alerts"
            icon="⛈️"
            isSwitch
            isSwitchOn={user.preferences?.weatherAlerts ?? true}
            onToggle={(value) => handleNotificationToggle('weatherAlerts', value)}
          />
          <SettingItem
            title="Crop Reminders"
            icon="🌱"
            isSwitch
            isSwitchOn={user.preferences?.cropReminders ?? true}
            onToggle={(value) => handleNotificationToggle('cropReminders', value)}
          />
          <SettingItem
            title="Community Updates"
            icon="👥"
            isSwitch
            isSwitchOn={user.preferences?.communityUpdates ?? true}
            onToggle={(value) => handleNotificationToggle('communityUpdates', value)}
          />
        </View>

        {/* App Info & Actions */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Settings & Support</Text>
          
          <SettingItem
            title="App Settings"
            icon="⚙️"
            onPress={() => navigation.navigate('Settings')}
          />
          <SettingItem
            title="Help & Support"
            icon="❓"
            onPress={() => Alert.alert('Help & Support', 'For support, please contact: support@krishiveda.com')}
          />
          <SettingItem
            title="About KrishiVeda"
            icon="📱"
            value="Version 1.0.0"
            onPress={() => Alert.alert('About KrishiVeda', 'KrishiVeda - Smart Farming Made Simple\n\nVersion 1.0.0\nBuilt with ❤️ for farmers')}
            showChevron={false}
          />
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            Alert.alert(
              "Sign Out",
              "Are you sure you want to sign out?",
              [
                { text: "Cancel", style: 'cancel' },
                {
                  text: "Sign Out",
                  style: 'destructive',
                  onPress: () => dispatch(logoutUser()),
                },
              ]
            );
          }}
        >
          <Text style={styles.logoutButtonText}>🚪 Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
      
      {/* Edit Profile Modal */}
      {user && (
        <EditProfileModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          user={user}
          onSave={handleEditProfile}
        />
      )}
    </View>
  );
};

export default ProfileScreen;

